import pandas as pd

# set file path and header and load the file
# skipping first row which is file header
file_path = "raw/30-04_1_raw.xlsx"
header_en = ["sex", "location", "age", "id", "name_ar_raw", "serial_no"]
df = pd.read_excel(file_path, skiprows=1, names=header_en)

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
    'ذكر': 'male',
    'انثى': 'female',
    'انثي': 'female',
    'أنثي': 'female',
    'أنثى': 'female',
    'دكر': 'male'
}
df['sex'] = df['sex'].replace(sex_mapping)


df = df[["id", "name_ar_raw", "dob", "age", "sex", "source"]]
print(df.head())
print(df['sex'].unique())

