import re
import logging
import pandas as pd
from datetime import datetime

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

logging.info("loading input from csv file")
working_dir = "scripts/data/common/killed-in-gaza"
# set file path and header and load the file
# skipping first row which is file header
file_path = f"{working_dir}/raw/20240726.csv"
header_en = ["source", "age", "sex", "dob", "id", "name_ar_raw", "index"]
df = pd.read_csv(file_path, names=header_en, header=0)

logging.info("applying file specfic cleaning on the file")

# replacing sex with english naming
sex_mapping = {
    'ذكر': 'M',
    'أنثى': 'F'
}
df['sex'] = df['sex'].replace(sex_mapping)

# replacing source with abbreviated english naming
source_mapping = {
    "تبليغ ذوي الشهداء": "c", # community sourcing
    "سجالت وزارة الصحة": "h", # health ministry
}
df['source'] = df['source'].replace(source_mapping)

# changing dob format from dd-mm-yy to yyyy-mm-dd
def convert_dob(dob, age):
    date, month, year = [part.zfill(2) for part in dob.split("-")]
    prefix = '20' if 0 <= int(year) <= 24 and 0 <= age <= 24 else '19'
    return f"{prefix}{year}-{month}-{date}"

# Apply conversion
df['dob'] = df.apply(lambda row: convert_dob(row['dob'], row['age']), axis=1)

# fixing the order of the columns to match data/raw.csv
df = df[["index", "name_ar_raw", "id", "dob", "sex", "age", "source"]]

logging.info("creating csv file with cleaned version of data")
# writing to a csv and removing new line since script reconcile_lists.ts
# excepts no new line as end of file
file_out = f"{working_dir}/output/20240726_input_reconcile_w_src.csv"
df.to_csv(file_out, index=False)
file_data = open(file_out, 'rb').read()
open(file_out, 'wb').write(file_data[:-1])



