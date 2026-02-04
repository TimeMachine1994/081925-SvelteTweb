# WBS: TrialDirector Object Load File (.OLL) Specification

## 1.0 File Schema Overview
**File Extension:** `.OLL` (Object Load File)
**Format:** Quoted CSV (Comma Separated Values)
**Encoding:** ANSI or UTF-8 (Standard ASCII preferred for legacy compatibility)

### 1.1 Column Mapping
The file consists of 9 columns per row. Each row represents a single page of a document.

| Index | Field Name | Requirement | Value / Logic |
| :--- | :--- | :--- | :--- |
| 0 | **Object Type** | Static | Hardcode to `"2"` (Legacy toggle, effectively unused). |
| 1 | **Document ID** | **Dynamic** | The Exhibit Number (e.g., `"0069"`). *Must remain constant for all pages of one document.* |
| 2 | **Image ID** | **Dynamic** | The Unique Bates/Page ID (e.g., `"0069"`, `"0070"`). *Must be unique across the entire load file.* |
| 3 | **Page Sequence** | **Dynamic** | Integer string (e.g., `"1"`, `"2"`). Resets to `"1"` for every new Document ID. |
| 4 | **Unused** | Empty | Hardcode to `""`. |
| 5 | **Unused** | Empty | Hardcode to `""`. |
| 6 | **Volume Label** | Static/Dyn | The logical folder name in TrialDirector (e.g., `"00 Ps' Trial Exhibits"`). |
| 7 | **Filename** | **Dynamic** | The exact filename including extension (e.g., `"file.pdf"`). |
| 8 | **Unused** | Empty | Hardcode to `""`. |

---

## 2.0 Data Logic & Relationships
Rules for ensuring the `Document-Page` jump command (e.g., "0069-01") functions correctly.

### 2.1 Grouping Logic (The Document)
* **Trigger:** A "Document" is defined by **Field 1 (Document ID)**.
* **Constraint:** All pages belonging to a specific exhibit must share the exact same string in Field 1.

### 2.2 Sequencing Logic (The Page)
* **Field 3 (Page Sequence):**
    * First page of a new Document ID must be `"1"`.
    * Subsequent pages must increment linearly (`"2"`, `"3"`, `"4"`...).
    * **Stop Condition:** When the filename changes or the logical document ends, reset counter to `"1"` for the next row.

### 2.3 Unique Identifier Logic (The Image Key)
* **Field 2 (Image ID):**
    * This is the database primary key for the specific page image.
    * **Standard Practice:** For the first page, `Image ID` usually matches `Document ID`.
    * **Continuation:** For subsequent pages, this ID must increment to ensure uniqueness (e.g., Doc `0069` Page 2 becomes ImageID `0070`).
    * **Conflict Prevention:** Ensure the Image ID sequence does not overlap with the start of the *next* Document ID.

---

## 3.0 Formatting & Syntax Constraints
Strict formatting rules to prevent import errors in TrialDirector.

### 3.1 Delimiters and Encapsulation
* **Quotes:** EVERY field must be enclosed in double quotes (`"`).
    * *Correct:* `"Value"`
    * *Incorrect:* `Value`
* **Commas:** Fields are separated by a single comma `,`.
* **Spacing:**
    * **CRITICAL:** There must be **NO SPACE** after the comma between fields.
    * *Correct:* `"2","0069"`
    * *Fail:* `"2", "0069"`

### 3.2 Null/Empty Fields
* Empty fields (Indices 4, 5, 8) must be represented as empty quoted strings: `""`.

---

## 4.0 Implementation Logic (Pseudo-Code)
Logic for a script (Python/JS) to generate this file from a directory of PDFs.

### 4.1 Variables
* `current_doc_id` (String)
* `global_bates_counter` (Integer) - *Optional, if renaming images*
* `local_page_counter` (Integer)

### 4.2 Iteration Loop
1.  **Sort** source files alphanumerically.
2.  **For Each** PDF file:
    * Extract `DocID` from filename (or use a mapping CSV).
    * Determine `PageCount` of PDF.
    * **For** `i` from 1 to `PageCount`:
        * `Field_0` = `"2"`
        * `Field_1` = `DocID`
        * `Field_2` = Calculate Unique ID (Or use `DocID` + offset)
        * `Field_3` = `i` (Stringified)
        * `Field_6` = `"00 Ps' Trial Exhibits"`
        * `Field_7` = `Filename.pdf`
        * **Write Line:** Join fields with `","` and wrap ends in `"`.
        * Append `\n` (newline).

---

## 5.0 Validation Checklist
Before importing into TrialDirector, verify:
* [ ] No spaces exist between commas and quotes.
* [ ] Every line has exactly 9 fields (8 commas).
* [ ] Page sequence (`Field 3`) resets to `"1"` when `Field 1` changes.
* [ ] `Field 2` (Image ID) is unique for every single row in the file.