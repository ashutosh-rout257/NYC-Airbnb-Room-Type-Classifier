# NYC Airbnb Room Type Classification

![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-150458?style=flat-square&logo=pandas&logoColor=white)
![NumPy](https://img.shields.io/badge/NumPy-013243?style=flat-square&logo=numpy&logoColor=white)
![Scikit-learn](https://img.shields.io/badge/Scikit--learn-F7931E?style=flat-square&logo=scikitlearn&logoColor=white)
![Matplotlib](https://img.shields.io/badge/Matplotlib-3776AB?style=flat-square&logo=plotly&logoColor=white)
![Kaggle](https://img.shields.io/badge/Dataset-Kaggle-20BEFF?style=flat-square&logo=kaggle&logoColor=white)

> Predicting whether an NYC Airbnb listing is an entire home/apt, private room, or shared room based on its listing attributes.

## 🧭 Overview <a name="overview"></a>

This project builds a machine learning classification model to predict the room type of an Airbnb listing in New York City — entire home/apartment, private room, or shared room — using listing attributes such as price, location, availability, and review activity.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Dataset](#dataset)
- [Tools & Technologies](#tools--technologies)
- [Methods Used](#methods-used)
- [Key Insights](#key-insights)
- [Models](#models)
- [Results & Conclusion](#results--conclusion)
- [Author & Contact](#author--contact)

---

## ❓ Problem Statement <a name="problem-statement"></a>

The goal is to classify an Airbnb listing's room type — entire home/apartment, private room, or shared room — based on its price, location, availability, and review activity.

---

## 🗂️ Dataset <a name="dataset"></a>

- **Source:** Kaggle (NYC Airbnb listings, 2019)
- **Size:** 48,000+ rows, 16 columns
- **Target:** Room type — Entire home/apt, Private room, or Shared room

---

## 🛠️ Tools & Technologies <a name="tools--technologies"></a>

- **Language:** Python
- **Libraries:** NumPy, Pandas, Matplotlib, Seaborn, Scikit-learn

---

## ⚙️ Methods Used <a name="methods-used"></a>

1. Imported required libraries
2. Loaded the dataset (Kaggle → notebook)
3. Performed Exploratory Data Analysis (EDA), including univariate and bivariate analysis
4. Data cleaning and feature engineering
5. Separated features from the target
6. Train-test split (stratified, to preserve class balance)
7. Preprocessing using `ColumnTransformer` and pipelines
8. Model building:
   - Logistic Regression (baseline model)
   - Decision Tree
   - Random Forest
   - Gradient Boosting
9. Model comparison using stratified cross-validation
10. Hyperparameter tuning of the best-performing model
11. Final evaluation on the held-out test set
12. Saved the final pipeline as a pickle file

---

## 💡 Key Insights <a name="key-insights"></a>

- Checked for missing values, performed univariate analysis, examined correlation between numeric features, and inspected outliers — outliers were found in the price and minimum nights features.
- Visualized the geographic distribution of listings using a scatter plot.
- Dropped columns that carry no generalizable signal for a tabular model: `id`, `name`, `host_id`, `host_name`, and `last_review`.
- Filled missing values in `reviews_per_month` with 0 (representing no reviews).
- Capped extreme outliers in `price` and `minimum_nights` using percentile clipping, so a handful of data entry errors wouldn't distort the model.
- Used an 80-20 train-test split; the test set was never touched during model selection or tuning, and was used only once at the end to report final, honest performance.
- Used stratified splitting to preserve the class distribution across both sets, since the three room-type classes were imbalanced.
- Built separate preprocessing pipelines within a `ColumnTransformer`:
  - **Numeric features:** median imputation + standard scaling
  - **Categorical features:** one-hot encoding
- Since the classes were imbalanced, used `class_weight` instead of SMOTE — Logistic Regression, Decision Tree, and Random Forest all natively support a `class_weight` parameter.
- Compared all models using 3-fold stratified cross-validation on the training set for a fair, robust comparison.
- Used macro F1 score as the key tuning metric (instead of plain accuracy), since it better reflects performance across imbalanced classes.

---

## 🤖 Models <a name="models"></a>

- **Baseline model:** Logistic Regression
- **Other models tried:** Decision Tree, Random Forest, Gradient Boosting
- **Best model:** Random Forest — selected after cross-validation comparison, then tuned via `RandomizedSearchCV` optimizing for macro F1 score
- **Output:** Final tuned pipeline saved as a `.pkl` (pickle) file for future inference

### Cross-Validation Comparison (Training Set)

| Model | Accuracy | F1 Score |
|---|---|---|
| Logistic Regression | 0.659 | 0.522 |
| Decision Tree | 0.782 | 0.647 |
| Random Forest | 0.851 | 0.715 |
| Gradient Boosting | 0.850 | 0.705 |

---

## 📊 Results & Conclusion <a name="results--conclusion"></a>

- Random Forest was selected as the best model based on cross-validation performance.
- After hyperparameter tuning (`RandomizedSearchCV`, optimizing macro F1), the best macro F1 score achieved was **0.73**.
- **Final test set evaluation:** Accuracy of **0.886** and F1 score of **0.74**.
- A confusion matrix was used to evaluate how well the model's predictions matched the actual room type labels.
- Random Forest, tuned for macro F1, gave the best balance of accuracy and per-class performance across the three imbalanced room-type categories, and was saved as the final model.

---

## 👤 Author & Contact <a name="author--contact"></a>

- **Author:** Ashutosh Rout
- **Email:** ashutoshrout704@gmail.com
- **LinkedIn:** https://www.linkedin.com/in/ashutosh-rout-aa60832a1/
- **GitHub:** https://github.com/ashutosh-rout257
