# 🧊 Hands-On Lab: Snowflake + dbt + GitHub Copilot

> **Audience:** Data engineers comfortable with Snowflake and dbt, new to GitHub Copilot.
> **Duration:** ~60 minutes.
> **Setup:** No live Snowflake or dbt install required to *read through* the lab.
> Optional: run the generated SQL against a free [Snowflake trial](https://signup.snowflake.com/)
> with [`dbt-snowflake`](https://docs.getdbt.com/docs/core/connect-data-platform/snowflake-setup) if you want to see it execute end-to-end.

Welcome! In this lab you'll use **GitHub Copilot Chat**, **Copilot Agent mode**, and
**custom prompt files** to build a tiny but realistic dbt project — a raw → staging →
mart pipeline over a sample sales dataset — without writing the boilerplate yourself.

---

## 🗂️ What's in this folder

```
docs/labs/snowflake-dbt-copilot/
├── README.md              ← this lab
├── profile_table.py       ← Exercise 4 stub
└── seeds/
    └── raw_sales.csv      ← 20-row sample dataset (with intentional data quality issues)
```

By the end you will have generated:

```
models/
├── staging/
│   ├── stg_sales.sql
│   └── schema.yml
└── marts/
    └── mart_sales_americas.sql
.github/prompts/
└── profile-table.prompt.md
```

> 💡 **No live connection?** Just paste the prompts into Copilot Chat in VS Code with this
> folder open. Copilot will generate the files in place — you can read, diff, and discuss
> them with the group without ever running `dbt`.

---

## 🧱 The layered pattern we're following

This lab uses the standard dbt **raw → staging → mart** layering:

| Layer    | Purpose                                                      | Example here              |
|----------|--------------------------------------------------------------|---------------------------|
| Raw      | Untouched source data (loaded as a dbt seed for this lab)    | `seeds/raw_sales.csv`     |
| Staging  | Light cleanup, renaming, type casting — one model per source | `stg_sales.sql`           |
| Mart     | Business-grade aggregates the org actually queries           | `mart_sales_americas.sql` |

Keep this in mind — it's the context you'll want Copilot to share.

---

## 📋 Before you start

1. Open this repository in VS Code with the **GitHub Copilot** and **GitHub Copilot Chat** extensions installed.
2. Open the Copilot Chat side panel (`Ctrl/Cmd + Alt + I`).
3. Open `docs/labs/snowflake-dbt-copilot/seeds/raw_sales.csv` so Copilot has it in context.
4. (Optional) If you have a Snowflake trial and dbt installed, initialize a project:
   ```bash
   dbt init octocat_sales
   cp docs/labs/snowflake-dbt-copilot/seeds/raw_sales.csv octocat_sales/seeds/
   cd octocat_sales && dbt seed
   ```

---

## 🧪 Exercise 1 — Generate a staging model with Copilot Chat

**Goal:** Use Copilot Chat to scaffold `stg_sales.sql` from `raw_sales.csv`, applying our
raw → staging → mart conventions (snake_case columns, explicit types, `ref()`).

### 📋 Sample prompt — paste into Copilot Chat

```
Using the file #seeds/raw_sales.csv as a dbt seed, generate a dbt staging model
called stg_sales.sql that follows our raw → staging → mart layered pattern.

- Reference the seed via {{ ref('raw_sales') }}.
- Cast order_date to date, quantity to integer, unit_price to numeric(10,2).
- Rename product_sku → sku, customer_id → customer_key.
- Add a total_amount computed column (quantity * unit_price).
- Include a top-of-file comment describing the model's purpose.
- Use a with source as (…) select … from source CTE pattern.
```

### ✅ Expected output: `models/staging/stg_sales.sql`

```sql
-- Staging model for raw_sales seed.
-- Cleans column names and casts types; one row per order line.
with source as (
    select * from {{ ref('raw_sales') }}
)
select
    cast(order_id      as integer)        as order_id,
    cast(order_date    as date)           as order_date,
    region,
    product_sku                           as sku,
    cast(quantity      as integer)        as quantity,
    cast(unit_price    as numeric(10,2))  as unit_price,
    customer_id                           as customer_key,
    cast(quantity as integer) * cast(unit_price as numeric(10,2)) as total_amount
from source
```

### 🔎 What to notice
- Copilot picked up your column names **directly from the CSV** in context.
- It uses `{{ ref() }}` — not a hardcoded table name. That's only possible because the
  prompt told it this is a dbt project.
- Tightening the prompt (naming conventions, CTE style) gives you generated code that
  matches your team's patterns. **Vague prompts → generic dbt; specific prompts → your dbt.**

---

## 🧪 Exercise 2 — Build a regional mart

**Goal:** Have Copilot generate `mart_sales_americas.sql`, a daily aggregate by product
and region scoped to the Americas.

### 📋 Sample prompt — paste into Copilot Chat

```
Generate a dbt mart model mart_sales_americas.sql that reads from
{{ ref('stg_sales') }} and returns one row per (order_date, region, sku) for
the Americas region only. Include:

- total_quantity (sum of quantity)
- total_revenue (sum of total_amount)
- order_count (distinct order_id count)
Order results by order_date then sku. Add a header comment explaining the grain.
```

### ✅ Expected output: `models/marts/mart_sales_americas.sql`

```sql
-- Mart: daily sales aggregates for the Americas region.
-- Grain: one row per (order_date, region, sku).
with staged as (
    select * from {{ ref('stg_sales') }}
    where region = 'Americas'
)
select
    order_date,
    region,
    sku,
    sum(quantity)             as total_quantity,
    sum(total_amount)         as total_revenue,
    count(distinct order_id)  as order_count
from staged
group by order_date, region, sku
order by order_date, sku
```

### 🔎 What to notice
- Copilot **chained on Exercise 1** — it knows `total_amount` exists because `stg_sales.sql`
  is in the workspace. Context carries forward across prompts.
- The grain is documented in a comment. Asking for that explicitly is a cheap way to
  enforce documentation hygiene on every generated model.

---

## 🧪 Exercise 3 — Generate `schema.yml` with tests

**Goal:** Generate a `schema.yml` covering `stg_sales` and `mart_sales_americas` with
`not_null`, `unique`, `accepted_values`, and `relationships` tests — the four most
common dbt tests.

### 📋 Sample prompt — paste into Copilot Chat

```
Create a dbt schema.yml at models/staging/schema.yml that documents and tests
both stg_sales and mart_sales_americas. Include:

- not_null on order_id, order_date, sku, quantity, unit_price in stg_sales
- unique on order_id in stg_sales
- accepted_values on region (Americas, EMEA, APAC)
- A relationships test on mart_sales_americas.sku → stg_sales.sku
- A short description: on every model and column
```

### ✅ Expected output: `models/staging/schema.yml`

```yaml
version: 2

models:
  - name: stg_sales
    description: "Cleaned, typed view of raw_sales — one row per order line."
    columns:
      - name: order_id
        description: "Surrogate order identifier."
        tests:
          - not_null
          - unique
      - name: order_date
        description: "Date the order was placed."
        tests: [not_null]
      - name: region
        description: "Sales region."
        tests:
          - not_null
          - accepted_values:
              values: ['Americas', 'EMEA', 'APAC']
      - name: sku
        description: "Product SKU."
        tests: [not_null]
      - name: quantity
        description: "Units ordered."
        tests: [not_null]
      - name: unit_price
        description: "Unit price at time of sale."
        tests: [not_null]

  - name: mart_sales_americas
    description: "Daily sales aggregates for the Americas region."
    columns:
      - name: sku
        description: "Product SKU."
        tests:
          - not_null
          - relationships:
              to: ref('stg_sales')
              field: sku
```

### 🔎 What to notice
- Run `dbt test` (if you have a connection) and **expect failures** — the seed has:
  - a row with a missing `customer_id`
  - a row with `quantity = -1` (you could add a `dbt_utils.expression_is_true` test)
  - a row with a missing `unit_price` → trips the `not_null` test
- That's the point: tests should *catch* the data quality issues you embedded.
  Ask Copilot: *"Suggest additional tests that would catch the issues in `raw_sales.csv`."*

---

## 🧪 Exercise 4 — Agent mode + a reusable prompt file

**Goal:** Use **Copilot Agent mode** to complete `profile_table.py`, then capture the
prompt as a reusable `.github/prompts/profile-table.prompt.md` file you can `/` invoke
on any future CSV.

### Step 4a — Complete the script with Agent mode

1. Open `docs/labs/snowflake-dbt-copilot/profile_table.py`.
2. In Copilot Chat, switch the mode dropdown to **Agent**.
3. Paste the prompt below.

#### 📋 Sample prompt

```
Open docs/labs/snowflake-dbt-copilot/profile_table.py and implement the
profile_table function so that, given a path to a CSV file, it prints:

- the total row count
- for each column: the column name, null percentage (empty string = null,
  formatted to one decimal place), and distinct non-null value count

Use only the Python standard library (csv, pathlib, collections).
Then run it against docs/labs/snowflake-dbt-copilot/seeds/raw_sales.csv and
show me the output.
```

### ✅ Expected output (abbreviated)

```
Rows: 20

order_id        nulls=0.0%   distinct=20
order_date      nulls=0.0%   distinct=10
region          nulls=0.0%   distinct=3
product_sku     nulls=0.0%   distinct=3
quantity        nulls=0.0%   distinct=7
unit_price      nulls=5.0%   distinct=3
customer_id     nulls=5.0%   distinct=19
```

### Step 4b — Save it as a reusable prompt file

Ask Copilot:

```
Save the prompt I just used as a reusable prompt file at
.github/prompts/profile-table.prompt.md so I can invoke it with /profile-table
on any CSV in this repo. Parameterize the CSV path as ${input:csvPath}.
```

#### ✅ Expected output: `.github/prompts/profile-table.prompt.md`

````markdown
---
description: Profile a CSV file — row count, null %, and distinct counts per column.
mode: agent
---

Profile the CSV at `${input:csvPath}` using `docs/labs/snowflake-dbt-copilot/profile_table.py`.

If `profile_table` is not yet implemented, implement it using only the Python
standard library so that it prints:
- total row count
- per column: name, null percentage (empty = null, 1 decimal), distinct non-null count

Then run the script against `${input:csvPath}` and summarize anything that looks
like a data quality issue (high null %, suspicious distinct counts, negative numerics).
````

### 🔎 What to notice
- **Agent mode actually edits files and runs commands** — Ask/Chat mode would only
  *suggest* the implementation. You authorize each action.
- Capturing the prompt as a `.prompt.md` turns a one-off into **team tooling**.
  Anyone with this repo can now run `/profile-table` against a new CSV.
- The prompt file uses `${input:csvPath}` — Copilot will *prompt the user* for that
  value at invocation time. Great for parameterized workflows.

---

## 🧹 Wrap-up discussion

- Where did **specific context in the prompt** (file refs, naming conventions, layer
  names) most change Copilot's output?
- Which generated artifact would you **commit as-is** vs. require human review before
  merging? Why?
- What would you turn into a **custom instructions file** (`.github/copilot-instructions.md`)
  so you don't have to repeat yourself in every prompt?
- What other dbt boilerplate (sources, snapshots, exposures, macros) would you target
  next with Copilot?

## 📚 References

- [dbt project structure](https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview)
- [dbt tests](https://docs.getdbt.com/docs/build/data-tests)
- [GitHub Copilot prompt files](https://docs.github.com/en/copilot/customizing-copilot/about-customizing-github-copilot-chat-responses)
- [Snowflake free trial](https://signup.snowflake.com/)
