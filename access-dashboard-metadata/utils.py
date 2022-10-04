import pandas as pd
import numpy as np

import PicSureHpdsLib
import PicSureClient

from typing import List
import math

import json
import requests


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
