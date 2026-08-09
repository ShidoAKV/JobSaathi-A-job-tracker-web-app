import { useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import axios from "axios";

const Resume = () => {
const [analyzing, setAnalyzing] = useState(false);
const [analysis, setAnalysis] = useState(null);
const [jobDescription, setJobDescription] = useState("");

const handleAnalyze = async () => {
  if (!file) return;

  try {
    setAnalyzing(true);

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jobDescription);

    const token = localStorage.getItem("token");

    const response = await axios.post(
      "http://localhost:5000/api/resume/analyze",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Resume Analysis Response:", response.data);

    setAnalysis(response.data);
  } catch (error) {
    console.error("Resume Analysis Error:", error);
    alert(
      error.response?.data?.message ||
        "Failed to analyze resume"
    );
  } finally {
    setAnalyzing(false);
  }
};
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }

    setFile(selectedFile);
  };
  

  const removeFile = () => {
    setFile(null);
  };

  return (
    <div className="min-h-full">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Resume
        </h1>

        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Upload your resume and get AI-powered insights.
        </p>
      </div>

      {/* Upload Card */}
      <div className="max-w-3xl">

        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">

          {!file ? (
            <>
              {/* Upload Area */}
              <label
                htmlFor="resume-upload"
                className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition"
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Upload
                    size={30}
                    className="text-blue-600 dark:text-blue-400"
                  />
                </div>

                <h2 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">
                  Upload your resume
                </h2>

                <p className="mt-2 text-slate-500 dark:text-slate-400 text-center">
                  Click to choose your resume PDF
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  PDF only
                </p>

                <input
                  id="resume-upload"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </>
          ) : (
            <>
              {/* Selected File */}
              <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">

                <div className="flex items-center gap-4">

                  <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <FileText
                      size={24}
                      className="text-red-500"
                    />
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {file.name}
                    </p>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                </div>

                <button
                  onClick={removeFile}
                  className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                >
                  <X size={20} />
                </button>

              </div>

              {/* Job Description */}

              <div className="mt-6">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                 Job Description
               </label>

               <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                rows={8}
               className="w-full border border-slate-200 dark:border-slate-600
               bg-white dark:bg-slate-700
               text-slate-900 dark:text-white
               placeholder:text-slate-400
              rounded-xl p-4 outline-none
              focus:ring-2 focus:ring-blue-500
               resize-none"
              />
            </div>

              {/* Analyze Button */}
              <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-600 transition disabled:opacity-60"
              >
             {analyzing ? "Analyzing..." : "Analyze Resume"}
             </button>


             {/* AI Analysis Result */}
{analysis && (
  <div className="mt-8 bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6">

    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
      Resume Analysis Result
    </h2>

    {/* Score */}
    <div className="mb-6">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Resume Match Score
      </p>

      <p className="text-4xl font-bold text-blue-600 mt-1">
        {analysis.analysis?.matchScore ?? analysis.matchScore ?? 0}/100
      </p>
    </div>

    {/* Summary */}
    <div className="mb-6">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
        Summary
      </h3>

      <p className="text-slate-600 dark:text-slate-300">
        {analysis.analysis?.summary ?? analysis.summary}
      </p>
    </div>

    {/* Matched Skills */}
    <div className="mb-6">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
        Matched Skills
      </h3>

      <div className="flex flex-wrap gap-2">
        {(analysis.analysis?.matchedSkills ?? analysis.matchedSkills ?? []).map(
          (skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
            >
              {skill}
            </span>
          )
        )}
      </div>
    </div>

    {/* Missing Keywords */}
    <div>
      <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
        Missing Keywords
      </h3>

      <div className="flex flex-wrap gap-2">
        {(analysis.analysis?.missingKeywords ??
          analysis.missingKeywords ??
          []).map((keyword, index) => (
          <span
            key={index}
            className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
          >
            {keyword}
          </span>
        ))}
      </div>
    </div>

  </div>
)}
             

            </>
          )}

        </div>

      </div>

    </div>
  );
};

export default Resume;