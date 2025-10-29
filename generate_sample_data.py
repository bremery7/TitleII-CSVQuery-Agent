import csv
import random
from datetime import datetime, timedelta

# Sample data pools
entities = [
    "University Video Portal", "City Government Channel", "Public Library Media",
    "State Education Dept", "Community College", "Municipal Services",
    "Regional Transit Auth", "County Health Dept", "School District Media",
    "Public Works Dept", "Fire Department", "Parks and Recreation",
    "Housing Authority", "Water District", "Community Center",
    "Tech College Online", "State Archives", "Youth Services",
    "Veterans Affairs", "Environmental Agency", "Adult Education Center",
    "Transportation Dept", "Social Services", "Public Utilities",
    "Cultural Center", "Emergency Management", "Job Training Center",
    "Planning Commission", "Animal Services", "Building Dept",
    "Senior Center", "Code Enforcement", "Workforce Development",
    "Public Information", "Recycling Program", "Disability Services",
    "Economic Development", "Historic Preservation", "Traffic Engineering",
    "Volunteer Services", "Energy Efficiency", "Family Services",
    "Neighborhood Watch", "Stormwater Management", "Business Licensing",
    "Community Outreach", "Fleet Management", "Grant Administration",
    "Human Resources", "IT Services"
]

owners = [
    "admin@university.edu", "webmaster@city.gov", "library@public.org",
    "education@state.gov", "media@college.edu", "info@municipal.gov",
    "transit@regional.gov", "health@county.gov", "district@schools.edu",
    "works@city.gov", "fire@city.gov", "parks@county.gov",
    "housing@authority.gov", "water@district.gov", "center@community.org",
    "online@techcollege.edu", "archives@state.gov", "youth@services.org",
    "va@veterans.gov", "environment@agency.gov"
]

tags_pool = [
    "lecture;biology;intro", "council;meeting;public", "tutorial;reading;kids",
    "training;teachers;professional", "orientation;students;campus",
    "services;permits;applications", "safety;routes;schedules",
    "wellness;vaccination;covid", "curriculum;math;science",
    "infrastructure;roads;maintenance", "safety;training;emergency",
    "programs;sports;community", "applications;assistance;programs",
    "conservation;billing;services", "events;classes;seniors",
    "courses;programming;certificates", "history;documents;preservation",
    "programs;mentoring;education", "benefits;healthcare;support",
    "conservation;recycling;climate"
]

languages = ["English", "Spanish", "French", "Mandarin", "Arabic", "German"]
language_codes = ["en", "es", "fr", "zh", "ar", "de"]
usage_types = ["Standard", "EAD"]
creation_modes = ["Upload", "Machine", "Human"]
accuracies = ["90%", "91%", "92%", "93%", "94%", "95%", "96%", "97%", "98%", "99%", "100%"]

def random_date(start_year=2022, end_year=2024):
    start = datetime(start_year, 1, 1)
    end = datetime(end_year, 10, 27)
    delta = end - start
    random_days = random.randint(0, delta.days)
    return (start + timedelta(days=random_days)).strftime("%Y-%m-%d")

def generate_row(entry_id):
    # 30% chance of no captions
    has_captions = random.random() > 0.3
    
    if has_captions:
        lang_idx = random.randint(0, len(languages) - 1)
        return {
            "ENTRY_ID": entry_id,
            "ENTITY_NAME": random.choice(entities),
            "CREATED_AT": random_date(2022, 2023),
            "LAST_PLAYED_AT": random_date(2024, 2024),
            "PLAYS": random.randint(50, 3000),
            "OWNER": random.choice(owners),
            "TAGS": random.choice(tags_pool),
            "CATEGORIES": "InContext",
            "HAS_AUDIO_DESCRIPTION": random.choice(["true", "false"]),
            "CAPTIONS_LANGUAGE": languages[lang_idx],
            "CAPTIONS_LANGUAGE_CODE": language_codes[lang_idx],
            "CAPTIONS_USAGE_TYPE": random.choice(usage_types),
            "CAPTIONS_CREATION_MODE": random.choice(creation_modes),
            "CAPTIONS_EDITED": random.choice(["true", "false"]),
            "CAPTIONS_ACCURACY": random.choice(accuracies),
            "CAPTIONS_DISPLAY_ON_PLAYER": random.choice(["true", "false"])
        }
    else:
        return {
            "ENTRY_ID": entry_id,
            "ENTITY_NAME": random.choice(entities),
            "CREATED_AT": random_date(2022, 2023),
            "LAST_PLAYED_AT": random_date(2024, 2024),
            "PLAYS": random.randint(50, 3000),
            "OWNER": random.choice(owners),
            "TAGS": random.choice(tags_pool),
            "CATEGORIES": "InContext",
            "HAS_AUDIO_DESCRIPTION": "false",
            "CAPTIONS_LANGUAGE": "-",
            "CAPTIONS_LANGUAGE_CODE": "-",
            "CAPTIONS_USAGE_TYPE": "-",
            "CAPTIONS_CREATION_MODE": "-",
            "CAPTIONS_EDITED": "-",
            "CAPTIONS_ACCURACY": "-",
            "CAPTIONS_DISPLAY_ON_PLAYER": "-"
        }

# Generate first CSV file
print("Generating sample_data_1.csv...")
with open('c:/dev/sample_data_1.csv', 'w', newline='', encoding='utf-8') as f:
    fieldnames = [
        "ENTRY_ID", "ENTITY_NAME", "CREATED_AT", "LAST_PLAYED_AT", "PLAYS",
        "OWNER", "TAGS", "CATEGORIES", "HAS_AUDIO_DESCRIPTION",
        "CAPTIONS_LANGUAGE", "CAPTIONS_LANGUAGE_CODE", "CAPTIONS_USAGE_TYPE",
        "CAPTIONS_CREATION_MODE", "CAPTIONS_EDITED", "CAPTIONS_ACCURACY",
        "CAPTIONS_DISPLAY_ON_PLAYER"
    ]
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    
    for i in range(1, 1001):
        writer.writerow(generate_row(i))
        if i % 100 == 0:
            print(f"  Generated {i} rows...")

print("✓ sample_data_1.csv complete!")

# Generate second CSV file with different starting ID
print("\nGenerating sample_data_2.csv...")
with open('c:/dev/sample_data_2.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    
    for i in range(1001, 2001):
        writer.writerow(generate_row(i))
        if (i - 1000) % 100 == 0:
            print(f"  Generated {i - 1000} rows...")

print("✓ sample_data_2.csv complete!")
print("\nBoth files created successfully with 1000 rows each!")
