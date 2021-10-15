import pandas as pd
def check_new_version(old_file, new_file, columns, old_compare_col = None, new_compare_col = None):
    #Read in the dataframes
    old = pd.read_csv(old_file, sep = '\t', skiprows=10)
    new = pd.read_csv(new_file, sep = '\t', skiprows=10)
    
    # Determine which column to use for comparison
    if old_compare_col is None and new_compare_col is None:
        print("Finding column to compare...")
        old_compare_col = find_columns(old, columns)[0]
        if old_compare_col not in new.columns:
            print("Manual inspection of columns needed")
            return(None, None)
        else:
            new_compare_col = old_compare_col
    
    # Compare the new and old versions of the file            
    in_new_not_old = list(set(new[new_compare_col])-set(old[old_compare_col]))
    in_old_not_new = list(set(old[old_compare_col])-set(new[new_compare_col]))
    
    # Interpret results
    if len(in_new_not_old) == 0:
        print("All", new_compare_col, "in new version are in old")
        new_diffs = None
    else:
        print("There are", len(in_new_not_old), "IDs in new version not in old")
        new_diffs = new[new[new_compare_col].isin(in_new_not_old)]
    if len(in_old_not_new) == 0:
        print("All", old_compare_col, "in old version are in new")
        old_diffs = None
    else:
        print("There are", len(in_old_not_new), "IDs in old version not in new")
        old_diffs = old[old[old_compare_col].isin(in_old_not_new)]
    
    return(old_diffs, new_diffs)

def check_new_df(old_file, new_file, include_cols, exclude_cols, old_diffs, new_diffs):
    # Read in the dataframes
    old = pd.read_csv(old_file, sep = '\t', skiprows=10)
    new = pd.read_csv(new_file, sep = '\t', skiprows=10)
    
    # Prep dataframes for comparison
    if include_cols is not None:
        old = old[find_columns(old, include_cols)]
        new = new[find_columns(new, include_cols)]
    if exclude_cols is not None: 
        old = old.drop(find_columns(old, exclude_cols), axis=1)
        new = new.drop(find_columns(new, exclude_cols), axis=1)
    if old_diffs is not None:
        old = old.drop(old_diffs.index)
    if new_diffs is not None:
        new = new.drop(new_diffs.index)
        
    # Check if the dataframes are now the same    
    if old.shape != new.shape:
        print("Dataframes unequal")
        return(old, new)
    
    print("Testing to see if dataframes are equal...")
    test = old.equals(new)
    if test:
        print("Dataframes are equal, validation passed.")
        return(None, None)
    else:
        print("Dataframes are unequal, testing by row...")
        old_data = []
        new_data = []
        for index2, row2 in old.fillna("These are nans").iterrows():
            for index1, row1 in new.fillna("These are nans").iterrows():
                if row1==row2:
                    break
                if index1 == new.shape[0]:
                    old_data.append(row2)
                    new_data.append(row1)
        if len(old_data) == 0 and len(new_data)==0:
            print("Dataframes are equal, validation passed.")
            return(None, None)
        else:
            print("Dataframes are unequal, validation not passed.")
            return(old_data, new_data)

def find_columns(df, cols):
    result_cols = []
    for dfcol in df.columns:
        if dfcol.upper() in cols:
            result_cols.append(dfcol)
            
    return(result_cols)