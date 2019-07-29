import xml.etree.ElementTree as ET
import re
import string
import json

file_name ='Wikibooks-20190729070631.xml' 

#https://stackoverflow.com/a/25920989
it = ET.iterparse(file_name)
for _, el in it:
    if '}' in el.tag:
        el.tag = el.tag.split('}', 1)[1]  # strip all namespaces
root = it.root

def remove_internal_links(text):
    return re.sub(r'\[\[[^:]*:([^|\]]*)(\|([^\]]*))?\]\]', lambda m:m.group(3), text)

tests=[
    "* [[Cookbook:Sour cream|sour cream]] and sugar or [[Cookbook:Jam|jam]], confiture.",
    "* 2 [[Cookbook:Egg|egg]]s",
    "* 2 tablespoons [[Cookbook:Sugar|sugar]]",
    "* 3-5 [[Cookbook:Tablespoon|tablespoons]] of [[Cookbook:Ghee|ghee]] or cooking oil",
    " * [[Cookbook:Eggs|eggs]]"
]

expected_output=[
    '* sour cream and sugar or jam, confiture.',
    '* 2 eggs',
    '* 2 tablespoons sugar',
    '* 3-5 tablespoons of ghee or cooking oil',
    " * eggs",
]

assert([remove_internal_links(x) for x in tests] == expected_output)

def parse_sections(text):
    sections = [[None, []]]
    cur_section = None
    for l in text.split("\n"):
        m=re.match(r'==(.*)==', l)
        if m is not None:
            cur_section=m.group(1)
            sections.append([cur_section, []])
        else:
            sections[-1][1].append(l)
    section_map = {}
    for k,v in sections:
        section_map.setdefault(k, []).append(v)
    return sections, section_map

base_units={
    "package",
    "cup",
    "tsp",
    "tbsp",
    "quart",
    "g",
    "ml",
    "l",
    "oz",
    "fl oz",
    "lb",

    "can",
    "part",
}

unit_synonyms={
    #"can": "",
    "cans": "can",
    "cups": "cup",
    "cupful": "cup",
    "cupfuls": "cup",
    "mL": "ml",
    "teaspoon": "tsp",
    "teaspoons": "tsp",
    "tablespoon": "tbsp",
    "tablespoons": "tbsp",
    #"part": "",
    "parts": "part",
    "pound": "lb",
    "pounds": "lb",
}
for i in base_units: unit_synonyms[i]=i

vulgar_fractions = "½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒"

def parse_ingredient(x):
    x=re.sub(r'\b(\w*)\b', lambda m:unit_synonyms.get(m.group(1).lower(), m.group(1)), x)
    x=re.sub(r'\([^)]*\) ?', '', x) #remove parenthesized units
    
    x= x.split(",")[0] #remove further info (separated by comma)
    
    res = None
    for i in base_units:
        #z=x.split(" %s "%i)
        z=re.split(r'(\b|\d|[%s])%s\b'%(vulgar_fractions, i), x)
        #print(i,z)
        if len(z)==3:
            #format is [amount] [unit] [name]
            if res is not None:
                return None #conflicting units!
            res={"amount":(z[0]+z[1]).strip(), "unit":i, "name":z[2].strip()}
    
    allowed_amount_chars = (string.digits + vulgar_fractions + "/")
    
    if res is None:
        #format is [amount] [name], unitless (possibly does not have amount)
        #we'll take the last numeric (digit or vulgar fraction) character
        indices = [k for k,i in enumerate(x) if i in allowed_amount_chars]
        if len(indices):
            max_index=max(indices)
            res={ #no unit, has amount
                "amount":x[:max_index+1].strip(),
                "unit":"",
                "name":x[max_index+1:].strip()
            }
        else:
            res={"amount":"1", "unit":"", "name":x} #no unit, no amount
    
    amount = str(res["amount"])
    amount = "".join(i for i in amount if i in allowed_amount_chars+" ").strip()

    unit = res["unit"]
    
    name = str(res["name"])
    name = name.lstrip("of ")
    if len("%s %s %s"%(amount, unit, name)) < 0.5*len(x): return None
    
    return {"amount":amount, "unit":unit, "name":name}

#print(parse_ingredient("salt and pepper to taste"))
#print(parse_ingredient("100g sugar"))
#print(parse_ingredient("100 fl oz sugar"))
#quit()

total=[]
for page in root.findall("page"):
    title = page.find('title').text
    if not title.startswith("Cookbook"): continue
    rev = page.find('revision')
    text = rev.find('text').text
    categories = [m.group(1) for m in re.finditer(r'\[\[Category:([^|\]]*)(\|.*)?\]\]', text)]
    
    #if "Recipes with images" not in categories: continue
    
    sections,section_map = parse_sections(text)
    section_names = [k for k,v in sections]
    
    if not all(i in section_names for i in ("Ingredients", "Procedure")): continue
    if not all(len(section_map[i])==1 for i in ("Ingredients", "Procedure")): continue
    
    ingredients = section_map["Ingredients"][0]
    procedure = section_map["Procedure"][0]
    
    ingredients = [remove_internal_links(i[1:].strip()) for i in ingredients if i.startswith('*')]
    procedure = [remove_internal_links(i[1:].strip()) for i in procedure if i.startswith('#')]
    ingredients = [i for i in ingredients if len(i)]
    procedure = [i for i in procedure if len(i)]
    
    if len(ingredients)==0: continue
    if len(procedure)==0: continue
    
    recipe_name = title.split(":")[1]
    ingredients_json = [parse_ingredient(i) for i in ingredients]
    
    if any(i is None for i in ingredients_json): continue
    ingredients_json = [i for i in ingredients_json if i is not None]

    recipe = {"name": recipe_name, "ingredients": ingredients_json, "steps": procedure}
    
    #print(recipe_name)
    #print(section_names)
    #
    ##print(ingredients)
    ##print(procedure)
    #for i in ingredients: print(i)
    #for i in ingredients_json: print(i)
    #print()
    #for i in procedure: print(i)
    #print()
    #input()
    
    #print(recipe)
    total.append(recipe)
    

print(len(total),"recipes exported")

with open("recipes_wiki.json","w") as f:
    json.dump(total, f)
