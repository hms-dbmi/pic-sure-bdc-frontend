import pandas as pd
import numpy as np

import PicSureHpdsLib
import PicSureClient

from typing import List
import math

import json
import requests


def get_multiIndex_variablesDict(variablesDict: pd.DataFrame) -> pd.DataFrame:

    def _varName_toMultiIndex(index_varDictionnary: pd.Index) -> pd.MultiIndex:
        long_names = index_varDictionnary.tolist()
        splits = [long_name.strip('\\').split('\\') for long_name in long_names]
        multi_index = pd.MultiIndex.from_tuples(splits)
        return multi_index

    def _get_simplified_varname(variablesDict_index: pd.MultiIndex) -> pd.DataFrame:
        tup_index = variablesDict_index.tolist()
        last_valid_name_list = [[x for x in tup if str(x) != 'nan'][-1] for tup in tup_index]
        return last_valid_name_list
    
    def _get_number_modalities(categoryValues: pd.Series) -> pd.Series:
        for elem in categoryValues:
            if isinstance(elem, list):
                yield len(elem)
            else:
                yield np.NaN
    variablesDict = variablesDict.rename_axis("name", axis=0).sort_index()
    multi_index = _varName_toMultiIndex(variablesDict.index)
    last_valid_name_list = _get_simplified_varname(multi_index)
    variablesDict = variablesDict.reset_index(drop=False)
    variablesDict.index = multi_index.rename(["level_" + str(n) for n, _ in enumerate(multi_index.names)])
    variablesDict["nb_modalities"] = list(_get_number_modalities(variablesDict["categoryValues"]))
    variablesDict["simplified_name"] = last_valid_name_list
    columns_order = ["simplified_name", "name", "observationCount", "categorical", "categoryValues", "nb_modalities", "min", "max", "HpdsDataType"]
    return variablesDict[columns_order]


def get_dic_renaming_vars(variablesDict: pd.DataFrame) -> dict:
    simplified_varName = variablesDict["simplified_name"].tolist()
    varName = variablesDict["name"].tolist()
    dic_renaming = {long: simple for long, simple in zip(varName, simplified_varName)}
    return dic_renaming


def match_dummies_to_varNames(plain_columns: pd.Index,
                             dummies_columns: pd.Index,
                             columns: list =["simplified_name", "dummies_name"]) -> pd.DataFrame:
    dic_map = {}
    for plain_col in plain_columns:
        dic_map[plain_col] = [dummy_col for dummy_col in dummies_columns if dummy_col.startswith(plain_col)]
    matching_df = pd.DataFrame([[k, v] for k, v_list in dic_map.items() for v in v_list], columns=columns)
    return matching_df


def joining_variablesDict_onCol(variablesDict: pd.DataFrame,
                                 df: pd.DataFrame,
                                 left_col="simplified_name",
                                 right_col="simplified_name",
                                overwrite: bool = True) ->pd.DataFrame:
    # Allow to join a df to variablesDict on a specified columns, keeping the MultiIndex
    # Might become a method of object variablesDict because very specific
    variablesDict_to_join = variablesDict.reset_index(drop=False).set_index(left_col)
    df_to_join = df.set_index(right_col)
    variablesDict_index_names = [col for col in variablesDict_to_join.columns if col not in variablesDict.columns]
    if np.any([col in variablesDict_to_join.columns for col in  df_to_join.columns]):
        col_overlap = [col for col in  df_to_join.columns if col in variablesDict_to_join.columns]
        if overwrite is True:
            variablesDict_to_join = variablesDict_to_join.drop(col_overlap, axis=1)
        else:
            print("{0} already in variableTable".format(col_overlap))
            return variablesDict
    variablesDict_joined = variablesDict_to_join.join(df_to_join, how="left")
    variablesDict_joined = variablesDict_joined.reset_index(drop=False)\
        .set_index(variablesDict_index_names)
    return variablesDict_joined

def get_full_consent_vals(to_validate, patient_ref_file):
    # Uses a user-defined list of phs codes to find the full consent value (ie phsXXXXXX.c1)
    full_phs = []
    if len(to_validate) > 0:
        for phs in to_validate:
            for full in list(patient_ref_file['consent']):
                if phs in full and ".c0" not in full:
                    full_phs.append(full)
    return full_phs

def compare_datadict_indices(d1, d2, comparison, to_validate=[]):
    # Compares the concept paths in d2 to d1 to find differences. 
    d1_ind = list(d1.index)
    d2_ind = list(d2.index)
    if comparison==1:
        d1_name = 'integration'
        d2_name = 'production'
    elif comparison==2:
        d1_name = 'production'
        d2_name = 'integration'
    diff = list(set(d1_ind)-set(d2_ind))
    wrong = []
    for i in diff:
        if (len(to_validate)==0) or (len(to_validate)>0 and not any(study in i for study in to_validate)):
            wrong.append(i)
    if len(wrong)<1:
        print("All concepts in", d2_name, "are in", d1_name)
    else:
        print("The following concepts are in", d1_name, "but not in", d2_name, ':')
        for i in wrong:
            print(i)
    return wrong

def compare_datadicts(integ, prod, to_validate, full_phs, harmonized, topmed, patient_ref_file):
    print("Initializing variables and getting counts...")
    # Initialize variables used in function
    columns = ['min', 'max', 'patientCount', 'observationCount', 'categorical', 'HpdsDataType', 'categoryValues', 'description'] # Names of columns in data dictionary
    
    genome_vars = ['Variant_consequence_calculated', 'Gene_with_variant', 'Variant_class', 'Variant_frequency_as_text', 'Variant_severity']
    genome_keys = ['patientCount', 'observationCount']
    
    # Get the expected differences in patient counts for each group
    diff_total = patient_ref_file[patient_ref_file['consent'].isin(full_phs)].sum()['patient_count']
    if len(harmonized)>0:
        harmonized_diff_total = patient_ref_file[patient_ref_file['consent'].isin(harmonized)].sum()['patient_count']
    else:
        harmonized_diff_total = 0
    if len(topmed)>0:
        topmed_diff_total = patient_ref_file[patient_ref_file['consent'].isin(topmed)].sum()['patient_count']
    else:
        topmed_diff_total = 0
    
    integration = list(integ.index)
    to_check = {}
    
    print("Comparing data dictionaries...")
    # Begin comparing data dictionaries
    for integ_key in integration:
        # Skip the concept paths in integration and not in production (user defined)
        if any(phs in integ_key for phs in to_validate):
            continue
        # Skip harmonized concept paths if harmonized study was added
        if harmonized_diff_total > 0 and '\\DCC Harmonized data set\\' in integ_key:
            continue
            '''NOTE: This can be improved - we would know the expected difference between production and integration, so 
            we could check this. It is more complicated. We will do this later.'''
            
        
        mini_list = []
        # Iterate through columns of data dictionary and test if match
        for i in columns:
            
            # Account for instances where min and max could be nan
            if i in ['min', 'max']:
                # If both are nan, they match and pass test
                if math.isnan(integ.loc[integ_key][i]) and math.isnan(prod.loc[integ_key][i]):
                    test = True
                # If both are numbers, test if the numbers are the same
                else:
                    test = integ.loc[integ_key][i] == prod.loc[integ_key][i]
            
            # Patient and observation counts of genomic variables are recorded differently
            elif i in genome_keys:
                if integ_key in genome_vars:
                    test = math.isnan(integ.loc[integ_key][i]) == math.isnan(prod.loc[integ_key][i])
                else:
                    test = integ.loc[integ_key][i] == prod.loc[integ_key][i]
            
            # Account for all other rows
            else:
                test = integ.loc[integ_key][i] == prod.loc[integ_key][i]
            
            # Record each column that doesn't pass validation
            if test == False:
                mini_list.append(i)
        if len(mini_list) > 0:
            to_check[integ_key] = mini_list
    print("Finished comparison.")
    print("Results:")
    
    # View the results
    # First display the results that were not any consent concept paths
    if len(to_check) == 0:
        print("Data dictionaries match completely.")
        return(to_check)
    
    for key in to_check.keys():
        # Major consent concept paths
        if key in ['\\_consents\\', '\\_Parent Study Accession with Subject ID\\', '\\_parent_consents\\']:
            print_results(to_check, diff_total, integ, prod, key)
        # Ha#rmonized consents concept path
        if key == '\\_harmonized_consent\\':
            print_results(to_check, harmonized_diff_total, integ, prod, key)
        # Topmed consents concept path
        if key == '\\_topmed_consent\\':
            print_results(to_check, topmed_diff_total, integ, prod, key)
        # All other results
        else:
            print("\nConcept path that differs in data dictionaries:")
            print(key)
            print("\nColumns that do not match:")
            for obs in to_check[key]:
                print(obs)
                print("\tIntegration value:", integ.loc[key][obs])
                print("\tProduction value:", prod.loc[key][obs])
    return to_check

def print_results(to_check, diff_total, integ, prod, key):
    for obs in to_check[key]:
        if integ.loc[key][obs]-diff_total != prod.loc[key][obs] and obs != 'categoryValues':
            print(key, obs, 'does not pass validation.')
            print('\tExpected difference:', diff_total)
            print("\tIntegration value:", integ.loc[key][obs])
            print("\tProduction value:", prod.loc[key][obs])
        else:
            print(key, obs, 'passes validation.')

def get_topmed_and_harmonized_consents(to_validate):
    url = 'https://biodatacatalyst.integration.hms.harvard.edu/picsureui/studyAccess/studies-data.json'
    r = requests.get(url)
    open('integration_studies-data.json', 'wb').write(r.content)
    
    y = open('integration_studies-data.json', 'r')
    studies_data_json = json.loads(y.read())
    
    to_validate_topmed = []
    to_validate_harmonized = []
    for i in studies_data_json['bio_data_catalyst']:
        if i['study_identifier'] in to_validate:
            if i['study_type'] == 'TOPMED' and i['study_identifier'] not in to_validate_topmed:
                to_validate_topmed.append(i['study_identifier'])
            if i['is_harmonized'] == 'Y' and i['study_identifier'] not in to_validate_harmonized:
                to_validate_harmonized.append(i['study_identifier'])
    return to_validate_topmed, to_validate_harmonized