import statistics
import numpy as np
import json
from scipy import spatial

#loads the data from one of the weather files dropping entries that do not conform
def load_data(file_name):
    loaded_data = {}
    with open(file_name, "r") as file:
        record_num = 0
        for weather_station in file:
            weather_records = weather_station.split()
            if len(weather_records)==371:
                loaded_data[weather_records[3]+ " " + weather_records[4]] = get_monthly(list(map(float, weather_records[5:])))
            else:
                print("ERROR: {}".format(record_num))
            record_num +=1
        return loaded_data

#takes a list of all the daily weathers for the year (366 days) and returns monthly averages
def get_monthly(daily_weather):
    month_lengths = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    averages = []
    cur_index = 0
    for i, length in enumerate(month_lengths):
        monthly_weather = daily_weather[cur_index:cur_index+length]
        monthly_weather = list(filter(lambda x: -60 < x and x < 100, monthly_weather))
        if len(monthly_weather)!=0:
            averages.append(statistics.mean(monthly_weather)) 
        else:
            averages.append(None)  
        cur_index += length
    return averages

#returns the weighted average of lists used for interpolating between weather stations
#lists must all be of equal length ex [2 2 2] [8 8 8] returns [5 5 5]
def average_lists(lists, weights):
    averaged_list = [0] * len(lists[0])
    counts = [0] * len(lists[0])
    for i in range(len(lists)):
        for j in range(len(lists[0])):
            if lists[i][j]:
                averaged_list[j]+= lists[i][j] * weights[i]
                counts[j]+= 1
    return [l/counts[i] for i, l in enumerate(averaged_list)]
	
def key_to_cord(key):
    return list(map(float, key.split()))

def cord_to_key(cord):
    return str(cord[0])+" "+str(cord[1])

# gets distance between two vectors (used for distance between weather stations and target
def distance(c1, c2):
    return np.linalg.norm(np.array(c1)-np.array(c2))

#interpolates the values for a year of data for a list of targets ie [[50, 150] [25, 150]]
def interpolate_year(data, targets):
    interpolated_vals = {}
    max_range = 5.0
    vals = list(data.values())
    cords = list(map(key_to_cord, data.keys()))
    quadTree = spatial.KDTree(np.array(cords))
    
    for target in targets:        
        stations_in_range = quadTree.query_ball_point(target, max_range)
		
        #Averages all the station values
        station_cords = [cords[i] for i in stations_in_range]
        station_vals = [vals[i] for i in stations_in_range]
        distances = list(map(lambda x: distance(target, x) , station_cords))
        if len(distances) > 1:
            interpolated_vals[cord_to_key(target)] = average_lists(station_vals, [i/max_range for i in distances])
        else:
            interpolated_vals[cord_to_key(target)] = [None] * 12
    return interpolated_vals
	
#interpolates for a range of years
def interpolate_range(start, stop, file_prefix, targets):
    all_data = {}
    for i in range(start, stop):
        print("Interpolating year: {}".format(i))
        yearly_data = load_data(file_prefix+str(i)+ ".txt")
        all_data[i] = interpolate_year(yearly_data, targets)
    return all_data

def example_usage():
	interpolated_range = interpolate_range(1950, 1960, "Tmax/X", [[50, 190]])
	json.dump(interpolated_range, open("tout.json","w"))