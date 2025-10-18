import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CertificatePage.css";

const CertificatePage = () => {
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);

  // Extract certificate ID from URL
  const queryParams = new URLSearchParams(window.location.search);
  const certificateId = queryParams.get("id");
  console.log("Certificate ID from URL:", certificateId);

  useEffect(() => {
    if (!certificateId) {
      setLoading(false);
      return;
    }

    // Fetch certificate from backend
    axios
      .get(`http://localhost:4000/certificates/verify/${certificateId}`)
      .then(res => {
        const data = res.data;
        setCertificate({
          studentName: data.name,
          courseName: data.track,
          pdfUrl: `http://localhost:4000/${data.pdf_path.replace(/^\/+/, '')}`


// adjust path if needed
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [certificateId]);

  const handleDownload = () => {
    if (certificate?.pdfUrl) {
      const link = document.createElement("a");
      link.href = certificate.pdfUrl;
      link.download = "Certificate.pdf";
      link.click();
    } else {
      alert("No certificate PDF available");
    }
  };

  const handleCopyLink = () => {
    if (certificate?.pdfUrl) {
      navigator.clipboard.writeText(certificate.pdfUrl);
      alert("Certificate link copied to clipboard!");
    }
  };

  const handleShare = (platform) => {
    if (!certificate?.pdfUrl) return;
    const text = encodeURIComponent("Check out my AI First Academy Certificate!");
    const url = certificate.pdfUrl;

    if (platform === "linkedin") {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
    } else if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
    }
  };

  if (loading) return <p>Loading certificate...</p>;
  if (!certificate) return <p>Certificate not found!</p>;

  return (
    <div className="certificate-container">
      <div className="certificate-card">
        <h1 className="academy-title">AI FIRST ACADEMY</h1>
        <h2 className="certificate-title">Certificate of Achievement</h2>
        <p className="certificate-text">
          This is to certify that <b>{certificate.studentName}</b> has successfully completed the
          <b> {certificate.courseName}</b> program.
        </p>
        <div className="sign-section">
          <div className="director-sign">
            <p>Dr. Sarah Chen</p>
            <span>Academy Director</span>
          </div>
          <div className="verified-badge">✅ Verified</div>
        </div>
      </div>

      <div className="button-group">
        <button onClick={handleDownload} className="btn download">Download Certificate</button>
        <button onClick={handleCopyLink} className="btn copy">Copy Link</button>
        <button onClick={() => handleShare("linkedin")} className="btn share">Share on LinkedIn</button>
        <button onClick={() => handleShare("twitter")} className="btn share">Share on Twitter</button>
      </div>
    </div>
  );
};

export default CertificatePage;
