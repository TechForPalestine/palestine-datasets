import pandas as pd

# Paths to the CSV files
ibc_path = "raw/2025-06-15_ibc.csv"
moh_path = "raw/2025-06-15_moh.csv"
output_path = "raw/2025-06-15.csv"

def update_age_column(ibc_path, moh_path, output_path):
    # Read both files
    df_ibc = pd.read_csv(ibc_path)
    df_moh = pd.read_csv(moh_path)
    # Ensure id columns are the same type
    df_ibc['id'] = df_ibc['id'].astype(str)
    df_moh['id'] = df_moh['id'].astype(str)
    # Select only id and age from moh
    moh_age = df_moh[['id', 'age']]
    # Merge, replacing age in ibc with age from moh where id matches
    df_merged = df_ibc.drop('age', axis=1).merge(moh_age, on='id', how='left')
    # Reorder columns to match original ibc file
    cols = list(df_ibc.columns)
    df_merged = df_merged[cols]
    # Save to new file
    df_merged.to_csv(output_path, index=False)
    print(f"Output written to {output_path}")

def check_age_distribution(output_path, moh_path):
    df_out = pd.read_csv(output_path)
    df_moh = pd.read_csv(moh_path)
    out_age_dist = df_out['age'].value_counts().sort_index()
    moh_age_dist = df_moh['age'].value_counts().sort_index()
    print("Age distribution in output file:")
    print(out_age_dist)
    print("\nAge distribution in MOH file:")
    print(moh_age_dist)
    if out_age_dist.equals(moh_age_dist):
        print("\nDistributions are identical.")
    else:
        print("\nDistributions are NOT identical.")

def add_source_column(output_path):
    df = pd.read_csv(output_path)
    df['source'] = 'u'
    df.to_csv(output_path, index=False)
    print(f"Added 'source' column to {output_path}")

def check_name_en_consistency(ibc_path, output_path):
    df_ibc = pd.read_csv(ibc_path)
    df_out = pd.read_csv(output_path)
    # Ensure id columns are the same type
    df_ibc['id'] = df_ibc['id'].astype(str)
    df_out['id'] = df_out['id'].astype(str)
    # Merge on id to compare name_en
    merged = df_ibc[['id', 'name_en']].merge(df_out[['id', 'name_en']], on='id', suffixes=('_ibc', '_out'))
    mismatches = merged[merged['name_en_ibc'] != merged['name_en_out']]
    if mismatches.empty:
        print("All name_en values are consistent between IBC and output CSV for each id.")
    else:
        print(f"Found {len(mismatches)} mismatches in name_en between IBC and output CSV:")
        print(mismatches.head())

if __name__ == "__main__":
    update_age_column(ibc_path, moh_path, output_path)
    check_age_distribution(output_path, moh_path)
    add_source_column(output_path)
    check_name_en_consistency(ibc_path, output_path)

# import pandas as pd

# # Path to the CSV file
# csv_path = "raw/2025-06-15_ibc.csv"

# def summarize_csv(csv_path):
#     df = pd.read_csv(csv_path)
#     summary = {}
#     summary['shape'] = df.shape
#     summary['columns'] = list(df.columns)
#     summary['head'] = df.head().to_dict(orient='records')
    
#     col_stats = {}
#     for col in df.columns:
#         stats = {}
#         stats['dtype'] = str(df[col].dtype)
#         stats['num_unique'] = df[col].nunique()
#         stats['num_nulls'] = df[col].isnull().sum()
#         stats['sample_values'] = df[col].unique()[:5].tolist()
#         if pd.api.types.is_numeric_dtype(df[col]):
#             stats['min'] = df[col].min()
#             stats['max'] = df[col].max()
#             stats['mean'] = df[col].mean()
#             stats['median'] = df[col].median()
#         elif pd.api.types.is_datetime64_any_dtype(df[col]):
#             stats['min'] = str(df[col].min())
#             stats['max'] = str(df[col].max())
#         elif col == 'age':
#             stats['value_counts'] = df[col].value_counts().to_dict()
#         elif col == 'sex':
#             stats['value_counts'] = df[col].value_counts().to_dict()
#         col_stats[col] = stats
#     summary['column_stats'] = col_stats
#     return summary

# if __name__ == "__main__":
#     # Update the path if needed
#     summary = summarize_csv(csv_path)
#     import pprint
#     pprint.pprint(summary)
