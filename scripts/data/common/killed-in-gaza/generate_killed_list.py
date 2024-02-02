import pandas as pd

pwd = "scripts/data/common/killed-in-gaza"

# Read raw data
raw_df = pd.read_csv(f'{pwd}/data/raw.csv', encoding="utf-8", keep_default_na=False)

# Read dict_ar_ar and dict_ar_en data
dict_ar_ar_df = pd.read_csv(f'{pwd}/data/dict_ar_ar.csv', encoding="utf-8", keep_default_na=False)
dict_ar_en_df = pd.read_csv(f'{pwd}/data/dict_ar_en.csv', encoding="utf-8", keep_default_na=False)

# Create a dictionary for arabic replacement
replacement_dict_ar = dict(zip(dict_ar_ar_df['original'], dict_ar_ar_df['cleaned']))

# Replace 'original' arabic name with 'cleaned' arabic name in 'name_ar_raw'
raw_df['name_ar_raw'] = raw_df['name_ar_raw'].replace(replacement_dict_ar, regex=True)

# Create a dictionary for english replacement
replacement_dict_en = dict(zip(dict_ar_en_df['ar'], dict_ar_en_df['en']))

# Function to get English equivalent from dict_ar_en
def get_en_names(names):
    return ' '.join(replacement_dict_en.get(word, word) for word in names.split())

# Apply the function to get 'en' values and create 'name_en' column
raw_df['name_en'] = raw_df['name_ar_raw'].apply(get_en_names)

# Save the result to a new CSV file
raw_df.to_csv(f'{pwd}/output/result.csv', index=False)
