const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');

const natural = require('natural');
const cosineSimilarity = require('compute-cosine-similarity');

function getTfidfMatches(user_profile, jobs) {
  const tfidf = new natural.TfIdf();

  tfidf.addDocument(user_profile);
  jobs.forEach(job => {
    tfidf.addDocument(job.skills_required || '');
  });

  const vectors = [];
  for (let i = 0; i < tfidf.documents.length; i++) {
    const terms = tfidf.listTerms(i);
    const vector = {};
    terms.forEach(({ term, tfidf }) => {
      vector[term] = tfidf;
    });
    vectors.push(vector);
  }

  const vocab = Array.from(new Set(vectors.flatMap(v => Object.keys(v))));
  const toArray = (obj) => vocab.map(key => obj[key] || 0);
  const userVector = toArray(vectors[0]);
  const jobVectors = vectors.slice(1).map(toArray);

  return jobVectors.map((vec, i) => ({
    job: jobs[i],
    score: cosineSimilarity(userVector, vec) * 100,
  }));
}


router.post('/jobs', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const user = await Profile.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const jobsRaw = await Profile.find({ roleType: "recruiter" });

    const jobs = jobsRaw.map(job => ({
      job_id: job._id,
      jobRole: job.jobRole,
      skills_required: (job.skills || "").toLowerCase().trim(),
      salary: job.salary,
      description: job.description,
      location: job.location || "Remote",
    }));

    const results = getTfidfMatches(user.skills.toLowerCase().trim(), jobs);

    const sorted = results
      .sort((a, b) => b.score - a.score)
      .map(({ job, score }) => ({ ...job, match_score: score.toFixed(2) }));

    res.status(200).json({ recommended_jobs: sorted });

  } catch (err) {
    console.error("Matching error:", err.message);
    res.status(500).json({ error: "Failed to match jobs" });
  }
});

module.exports = router;
