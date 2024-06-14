import re
import logging
import pandas as pd

# set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.StreamHandler()
    ]
)
logging.getLogger(__name__)

logging.info("loading input xlsx file")
working_dir = "scripts/data/common/killed-in-gaza/"
# set file path and header and load the file
# skipping first row which is file header
file_path = f"{working_dir}raw/30-04_1_raw.xlsx"
header_en = ["sex", "location", "age", "id", "name_ar_raw", "serial_no"]
df = pd.read_excel(file_path, skiprows=1, names=header_en)

logging.info("applying file specfic cleaning on the file")
# filtering only the columns to comply with schema in data/raw.csv
df = df[["id", "name_ar_raw", "age", "sex"]]

# removing one column which has empty values for all columns except sex
df = df[df['sex'] != 'ل']

# replace empty strings (if exist) in id and name_ar_raw
columns_to_replace = ['id', 'name_ar_raw']
df[columns_to_replace] = df[columns_to_replace].replace('', pd.NA)
rows_with_nan_name_ar_raw = df[df['name_ar_raw'].isna()]

# for 6 rows where name is empty and id is not empty
# id column incorrectly contains names
mask = df['name_ar_raw'].isna() & ~df['id'].isna()
df.loc[mask, 'name_ar_raw'] = df.loc[mask, 'id']
df.loc[mask, 'id'] = pd.NA

# remove wrong characters from id column
# incorrect_ids = [
#     'طفلةة','تحت الركام','-','مولود','_','طفلة','.','ال اعرف','ك',
#     'طفلل','طففل','طفل','طفلة حديث','طفل...خدج','طفل ...خدج','طفللل', '0'
# ]
# incorrect_ids_pattern = '[' + ''.join(incorrect_ids) + ']'
# df['id'] = df['id'].str.replace(incorrect_ids_pattern, '', regex=True)
# df['id'] = df['id'].replace('', pd.NA)
# # replace all NaNs in 'id' column with '000000000'
# df['id'] = df['id'].fillna('000000000')

# calculate dob from age keeping the date the list was published
# as the reference date
df['age'] = pd.to_numeric(df['age'], errors='coerce')
reference_date = pd.to_datetime('2024-04-30')
df['dob'] = reference_date - pd.to_timedelta(df['age']*365, unit='D')

# marking the source for all rows as h
df['source'] = 'h'

# checking all distinct values for sex column and
# replacing with english naming
sex_mapping = {
    'ذكر': 'M',
    'انثى': 'F',
    'انثي': 'F',
    'أنثي': 'F',
    'أنثى': 'F',
    'دكر': 'M'
}
df['sex'] = df['sex'].replace(sex_mapping)

# fixing the order of the columns to match data/raw.csv
df = df[["id", "name_ar_raw", "dob", "age", "sex", "source"]]

logging.info("creating csv file with cleaned version of data")
# writing to a csv and removing new line since script reconcile_lists.ts
# excepts no new line as end of file
file_out = f"{working_dir}output/20240501.csv"
df.to_csv(file_out, index=False)
file_data = open(file_out, 'rb').read()
open(file_out, 'wb').write(file_data[:-1])
