import pandas as pd

# Paths to the CSV files
ibc_path = "raw/2025-07-15_ibc.csv"
output_path = "output/2025-07-15.csv"

def align_age(ibc_path, output_path):
    df = pd.read_csv(ibc_path)
    # Convert 'age' column to numeric, coercing errors to 0
    df['age'] = pd.to_numeric(df['age'], errors='coerce').fillna(0).astype(int)
    # Save the modified DataFrame to the output path
    df.to_csv(output_path, index=False)
    print(f"Aligned 'age' column and saved to {output_path}")

def add_source_column(output_path):
    df = pd.read_csv(output_path)
    df['source'] = 'u'
    df.to_csv(output_path, index=False)
    print(f"Added 'source' column to {output_path}")

if __name__ == "__main__":
    align_age(ibc_path, output_path)
    add_source_column(output_path)

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
