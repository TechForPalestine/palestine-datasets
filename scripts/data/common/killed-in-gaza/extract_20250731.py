import pandas as pd

# Paths to the CSV files
ibc_path = "raw/2025-07-31_ibc.csv"
output_path = "output/2025-07-31.csv"

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
