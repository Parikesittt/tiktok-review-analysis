import pandas as pd
from flask import Flask, request, jsonify, render_template
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import io
import base64
import sys
import traceback



# Initialize Flask app
app = Flask(__name__)

df = pd.read_csv('static/tiktok-reviews.csv')

@app.errorhandler(500)
def internal_error(exception):
    print("500 error caught")
    etype, value, tb = sys.exc_info()
    print(traceback.print_exception(etype, value, tb))

@app.route("/")
def main():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Load saved model and vectorizer
        with open('static/tfidf_vectorizer.pkl', 'rb') as f:
            tfidf = pickle.load(f)

        with open('static/logistic_regression_model.pkl', 'rb') as f:
            lr_model = pickle.load(f)

        # Get data from form
        review_version = request.form['reviewCreatedVersion']

        # Filter dataset for the specified version
        filtered_data = df[df['reviewCreatedVersion'] == review_version]
        if filtered_data.empty:
            return render_template('index.html', error='No reviews found for this version.')

        # Predict sentiment for filtered reviews
        X_filtered = tfidf.transform(filtered_data['content'])
        filtered_data['predicted_sentiment'] = lr_model.predict(X_filtered)

        # Count sentiments
        sentiment_counts = filtered_data['predicted_sentiment'].value_counts()
        fig, ax = plt.subplots()
        sentiment_counts.plot(kind='bar', ax=ax, color=['red', 'green'])
        plt.title(f'Sentiment Distribution for Version {review_version}')
        plt.xlabel('Sentiment')
        plt.ylabel('Count')

        img = io.BytesIO()
        plt.savefig(img, format='png')
        img.seek(0)
        plot_url = base64.b64encode(img.getvalue()).decode('utf8')
        plt.close()

        # Get comments
        top5Reviews = filtered_data.nlargest(5, 'thumbsUpCount')
        comments = top5Reviews['content'].tolist()
        thumbsups = top5Reviews['thumbsUpCount'].tolist()
        reviews=[{"comment": comments, "thumbsup": thumbsups} for comments, thumbsups in zip(comments, thumbsups)]
        print(reviews)

        # Render results in the template
        return render_template(
            'index.html',
            plot_url=plot_url,
            comments=comments,
            selected_version=review_version,
            thumbsups = thumbsups,
            reviews=reviews
        )

    except Exception as e:
        return render_template('index.html', error=f"An error occurred: {str(e)}")

if __name__ == '__main__':
    app.run(debug=True)
