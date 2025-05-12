import csv
import logging
import pandas as pd

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


def process_data(file_path, output_path):
    logging.info(f"Reading file: {file_path}")
    with open(file_path, mode='r', encoding='utf-8') as file:
        reader = csv.reader(file)
        data = [row for row in reader]
    logging.info(f"Finished reading file: {file_path}")
    logging.info(f"Sample Data: {data[:5]}")
    # Convert data to DataFrame
    df = pd.DataFrame(data[1:], columns=data[0])
    df['source'] = 'u'
    # Rename columns
    df.columns = ["index", "name_en", "name_ar_raw", "age", "dob", "sex", "id", "source"]

    # Generate summary for each column
    for col in df.columns:
        print(f"\nSummary for {col}:")
        print(f"Total unique values: {df[col].nunique()}")
        print(f"5 unique values: {df[col].unique()[:5]}")
        if pd.api.types.is_numeric_dtype(df[col]):
            print(f"Min: {df[col].min()}")
            print(f"Max: {df[col].max()}")
    
    # Save the DataFrame to CSV without adding a newline at the end
    df.to_csv(output_path, index=False)
    logging.info(f"File saved to: {output_path}")

# Example usage
if __name__ == "__main__":
    file_path = "scripts/data/common/killed-in-gaza/raw/ibc_moh_2025-03-23.csv"
    output_path = "scripts/data/common/killed-in-gaza/output/result.csv"
    
    process_data(file_path, output_path)

