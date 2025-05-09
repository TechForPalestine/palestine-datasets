import csv
import logging
import pandas as pd

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Read the raw file 'ibc_moh_2025-03-23.csv'
def read_raw_file(file_path):
    logging.info(f"Reading file: {file_path}")
    with open(file_path, mode='r', encoding='utf-8') as file:
        reader = csv.reader(file)
        data = [row for row in reader]
    logging.info(f"Finished reading file: {file_path}")
    logging.info(f"Sample Data: {data[:5]}")
    return data

# Add a column 'source' with value 'unknown' and save the result to 'output/result.csv'
def add_source_column_and_save(data, output_path):
    # Convert data to DataFrame
    df = pd.DataFrame(data[1:], columns=data[0])
    df['source'] = 'u'
    # Save the DataFrame to CSV without adding a newline at the end
    df.to_csv(output_path, index=False, line_terminator='')
    logging.info(f"File saved to: {output_path}")


# Example usage
if __name__ == "__main__":
    file_path = "scripts/data/common/killed-in-gaza/raw/ibc_moh_2025-03-23.csv"
    output_path = "scripts/data/common/killed-in-gaza/output/result.csv"
    data = read_raw_file(file_path)
    add_source_column_and_save(data, output_path)
