// src/components/AddParticipantModal.jsx
import React, { useState, useRef } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Building,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  Loader,
  FileText,
  Users,
  Plus,
} from "lucide-react";
import { ParticipantService } from "../services/participantService";

const AddParticipantModal = ({
  isOpen,
  onClose,
  trainingId,
  onParticipantAdded,
}) => {
  const [activeTab, setActiveTab] = useState("single"); // 'single' or 'bulk'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Single participant form
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
  });

  // Bulk upload
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [bulkResults, setBulkResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const participantService = new ParticipantService();

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", department: "" });
    setCsvFile(null);
    setCsvData([]);
    setBulkResults(null);
    setError("");
    setSuccess("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Single participant submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      setError("Name and email are required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const participantData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        department: formData.department.trim() || null,
      };

      const newParticipant = await participantService.createParticipant(
        participantData,
        trainingId
      );

      setSuccess("Participant added successfully!");
      onParticipantAdded(newParticipant);

      // Reset form after success
      setTimeout(() => {
        resetForm();
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to add participant");
    } finally {
      setLoading(false);
    }
  };

  // CSV file handling
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (!file.name.endsWith(".csv")) {
      setError("Please select a CSV file");
      return;
    }

    setCsvFile(file);
    parseCsvFile(file);
  };

  const parseCsvFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split("\n");
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

        // Validate required headers
        const requiredHeaders = ["name", "email"];
        const missingHeaders = requiredHeaders.filter(
          (h) => !headers.includes(h)
        );

        if (missingHeaders.length > 0) {
          setError(`Missing required columns: ${missingHeaders.join(", ")}`);
          return;
        }

        const participants = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(",").map((v) => v.trim());
          const participant = {};

          headers.forEach((header, index) => {
            participant[header] = values[index] || "";
          });

          // Validate required fields
          if (participant.name && participant.email) {
            participants.push({
              name: participant.name,
              email: participant.email.toLowerCase(),
              phone: participant.phone || null,
              department: participant.department || null,
            });
          }
        }

        setCsvData(participants);
        setError("");
      } catch (err) {
        setError("Failed to parse CSV file. Please check the format.");
      }
    };

    reader.readAsText(file);
  };

  // Bulk upload submission
  const handleBulkUpload = async () => {
    if (csvData.length === 0) {
      setError("No valid participants found in CSV");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const results = await participantService.bulkCreateParticipants(
        csvData,
        trainingId
      );
      setBulkResults(results);

      if (results.successful.length > 0) {
        setSuccess(
          `Successfully added ${results.successful.length} participants`
        );
        // Notify parent of new participants
        results.successful.forEach((participant) => {
          onParticipantAdded(participant);
        });
      }
    } catch (err) {
      setError(err.message || "Failed to upload participants");
    } finally {
      setLoading(false);
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent =
      "name,email,phone,department\nJohn Doe,john@example.com,+1-555-0123,Engineering\nJane Smith,jane@example.com,+1-555-0124,Marketing";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "participants_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Add Participants</h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("single")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "single"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <User className="h-4 w-4 inline mr-2" />
            Single Participant
          </button>
          <button
            onClick={() => setActiveTab("bulk")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "bulk"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Upload className="h-4 w-4 inline mr-2" />
            Bulk Upload
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Single Participant Tab */}
          {activeTab === "single" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department/Role
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        department: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter department or role"
                  />
                </div>
              </div>
            </form>
          )}

          {/* Bulk Upload Tab */}
          {activeTab === "bulk" && (
            <div className="space-y-6">
              {/* Download Template */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">
                      CSV Template
                    </h4>
                    <p className="text-sm text-blue-700">
                      Download our template to ensure proper formatting
                    </p>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive
                    ? "border-blue-400 bg-blue-50"
                    : csvFile
                    ? "border-green-400 bg-green-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) =>
                    e.target.files[0] && handleFileSelect(e.target.files[0])
                  }
                  className="hidden"
                />

                {csvFile ? (
                  <div className="space-y-2">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                    <h4 className="font-medium text-gray-900">
                      {csvFile.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {csvData.length} participants found
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Choose different file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto" />
                    <h4 className="font-medium text-gray-900">
                      Upload CSV File
                    </h4>
                    <p className="text-sm text-gray-600">
                      Drag and drop your CSV file here, or click to browse
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Choose File
                    </button>
                  </div>
                )}
              </div>

              {/* CSV Preview */}
              {csvData.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Preview ({csvData.length} participants)
                  </h4>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                          <tr>
                            <th className="text-left py-2 px-3 font-medium text-gray-900">
                              Name
                            </th>
                            <th className="text-left py-2 px-3 font-medium text-gray-900">
                              Email
                            </th>
                            <th className="text-left py-2 px-3 font-medium text-gray-900">
                              Phone
                            </th>
                            <th className="text-left py-2 px-3 font-medium text-gray-900">
                              Department
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.slice(0, 10).map((participant, index) => (
                            <tr
                              key={index}
                              className="border-b border-gray-100"
                            >
                              <td className="py-2 px-3 text-gray-900">
                                {participant.name}
                              </td>
                              <td className="py-2 px-3 text-gray-600">
                                {participant.email}
                              </td>
                              <td className="py-2 px-3 text-gray-600">
                                {participant.phone || "-"}
                              </td>
                              <td className="py-2 px-3 text-gray-600">
                                {participant.department || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {csvData.length > 10 && (
                      <div className="bg-gray-50 px-3 py-2 text-sm text-gray-600 text-center">
                        ... and {csvData.length - 10} more participants
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bulk Results */}
              {bulkResults && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Upload Results</h4>

                  {bulkResults.successful.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-900">
                          {bulkResults.successful.length} participants added
                          successfully
                        </span>
                      </div>
                    </div>
                  )}

                  {bulkResults.duplicates.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium text-yellow-900">
                          {bulkResults.duplicates.length} duplicates skipped
                        </span>
                      </div>
                      <div className="text-sm text-yellow-800">
                        {bulkResults.duplicates.slice(0, 3).map((dup, i) => (
                          <div key={i}>{dup.email}</div>
                        ))}
                        {bulkResults.duplicates.length > 3 && (
                          <div>
                            ... and {bulkResults.duplicates.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {bulkResults.failed.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="font-medium text-red-900">
                          {bulkResults.failed.length} participants failed to add
                        </span>
                      </div>
                      <div className="text-sm text-red-800">
                        {bulkResults.failed.slice(0, 3).map((fail, i) => (
                          <div key={i}>
                            {fail.data.email}: {fail.error}
                          </div>
                        ))}
                        {bulkResults.failed.length > 3 && (
                          <div>
                            ... and {bulkResults.failed.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Success/Error Messages */}
          {success && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>

            {activeTab === "single" ? (
              <button
                onClick={handleSubmit}
                disabled={
                  loading || !formData.name.trim() || !formData.email.trim()
                }
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin h-4 w-4" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Add Participant</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleBulkUpload}
                disabled={loading || csvData.length === 0}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin h-4 w-4" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4" />
                    <span>Upload {csvData.length} Participants</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddParticipantModal;
