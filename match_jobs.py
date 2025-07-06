from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI()

class Job(BaseModel):
    job_id: str
    jobRole: str
    skills_required: str
    salary: str
    description: str

class MatchRequest(BaseModel):
    user_profile: str
    jobs: List[Job]

@app.post("/match_jobs")
def match_jobs(data: MatchRequest):
    df = pd.DataFrame([job.dict() for job in data.jobs])
    df['skills_required'] = df['skills_required'].fillna('').astype(str).str.lower().str.strip()
    user_profile = data.user_profile.lower().strip()

    texts = [user_profile] + df['skills_required'].tolist()
    vectorizer = TfidfVectorizer(stop_words='english', max_features=500)
    tfidf_matrix = vectorizer.fit_transform(texts)
    scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()

    df['match_score'] = (scores * 100).round(2)
    sorted_df = df.sort_values(by='match_score', ascending=False)
    return sorted_df.to_dict(orient='records')
