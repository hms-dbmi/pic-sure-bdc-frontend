import pandas as pd
def check_new_version(old_file, new_file, columns, old_compare_col = None, new_compare_col = None):
    #Read in the dataframes
    old = pd.read_csv(old_file, sep = '\t', skiprows=10)
    new = pd.read_csv(new_file, sep = '\t', skiprows=10)
    
    # Determine which column to use for comparison
    if old_compare_col is None and new_compare_col is None:
        print("Finding column to compare...")
        for col in old.columns:
            print(col)
            if col.upper() in columns:
                print(col)
                old_compare_col = col
                if old_compare_col not in new.columns:
                    print("Manual inspection of columns needed")
                    return(None, None)
                else:
                    new_compare_col = col
    
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