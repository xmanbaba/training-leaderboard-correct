// src/components/Settings.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Settings as SettingsIcon,
  Users,
  Share2,
  Save,
  AlertCircle,
  X,
  Trophy,
  Sliders,
  Copy,
  Check,
  Plus,
  Edit2,
  Trash2,
  Download,
  Shield,
  Mail,
  UserPlus,
  FileText,
  Upload,
  Target,
  Zap,
  Loader,
  CheckCircle,
} from "lucide-react";
import { useSession } from "../contexts/SessionContext";
import { SessionService } from "../services/sessionService";
import { ParticipantService } from "../services/participantService";

const Settings = () => {
  const { currentSession, refreshCurrentSession } = useSession();
  const [hasChanges, setHasChanges] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const fileInputRef = useRef(null);

  const sessionService = new SessionService();
  const participantService = new ParticipantService();

const [showDeleteSessionConfirm, setShowDeleteSessionConfirm] = useState(false);
const [deletingSession, setDeletingSession] = useState(false);

  const handleDeleteSession = async () => {
    try {
      setDeletingSession(true);

      await sessionService.deleteSession(currentSession.id);

      // Navigate away after deletion
      navigate("/sessions");
    } catch (error) {
      console.error("Error deleting session:", error);
      alert("Failed to delete session");
    } finally {
      setDeletingSession(false);
      setShowDeleteSessionConfirm(false);
    }
  };

  const [formData, setFormData] = useState({
    trainingName: "",
    cohort: "",
    startDate: "",
    endDate: "",
    minScore: -50,
    maxScore: 50,
    registrationOpen: true,
    allowNegativeScores: true,
    allowDecimalScores: false,
    isArchived: false,
  });

  const [categories, setCategories] = useState({
    positive: {},
    negative: {},
  });

  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryForm, setNewCategoryForm] = useState({
    type: "positive",
    key: "",
    name: "",
    icon: "Star",
    points: 5,
    description: "",
  });

  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [bulkResults, setBulkResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadingBulk, setUploadingBulk] = useState(false);

  // Pre-defined category templates
  const categoryTemplates = {
    positive: [
      {
        key: "participation",
        name: "Active Participation",
        icon: "MessageSquare",
        points: 5,
        description: "Actively engaged in discussions",
      },
      {
        key: "punctuality",
        name: "Punctuality",
        icon: "Clock",
        points: 3,
        description: "Arrived on time",
      },
      {
        key: "helpfulness",
        name: "Helping Others",
        icon: "Users",
        points: 4,
        description: "Helped fellow participants",
      },
      {
        key: "excellence",
        name: "Excellence",
        icon: "Star",
        points: 10,
        description: "Outstanding performance",
      },
      {
        key: "leadership",
        name: "Leadership",
        icon: "Crown",
        points: 8,
        description: "Demonstrated leadership",
      },
      {
        key: "creativity",
        name: "Creativity",
        icon: "Lightbulb",
        points: 7,
        description: "Creative thinking",
      },
      {
        key: "teamwork",
        name: "Teamwork",
        icon: "Users",
        points: 6,
        description: "Great team collaboration",
      },
    ],
    negative: [
      {
        key: "disruption",
        name: "Disruption",
        icon: "AlertTriangle",
        points: -5,
        description: "Disruptive behavior",
      },
      {
        key: "lateness",
        name: "Late Arrival",
        icon: "Clock",
        points: -2,
        description: "Arrived late",
      },
      {
        key: "absence",
        name: "Unexcused Absence",
        icon: "X",
        points: -10,
        description: "Absent without notice",
      },
      {
        key: "unprepared",
        name: "Unprepared",
        icon: "BookOpen",
        points: -3,
        description: "Came unprepared",
      },
      {
        key: "negativity",
        name: "Negative Attitude",
        icon: "Frown",
        points: -4,
        description: "Negative behavior",
      },
    ],
  };

  // Load session data - FIXED: Only update when session ID changes
  const sessionIdRef = useRef(null);
  useEffect(() => {
    if (currentSession && currentSession.id !== sessionIdRef.current) {
      sessionIdRef.current = currentSession.id;
      setFormData({
        trainingName: currentSession.name || "",
        cohort: currentSession.cohort || "",
        startDate: currentSession.startDate || "",
        endDate: currentSession.endDate || "",
        minScore: currentSession.scoringScale?.min || -50,
        maxScore: currentSession.scoringScale?.max || 50,
        registrationOpen: currentSession.registrationOpen ?? true,
        allowNegativeScores: currentSession.allowNegativeScores ?? true,
        allowDecimalScores: currentSession.allowDecimalScores ?? false,
        // FIX: Check if status is 'completed' to determine if archived
        isArchived: currentSession.status === "completed",
      });
      setCategories(
        currentSession.scoringCategories || { positive: {}, negative: {} }
      );
      setHasChanges(false);
    }
  }, [currentSession?.id]); // Make sure to depend on currentSession.id only

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!currentSession?.id) return;

    try {
      setSaving(true);
      await sessionService.updateSession(currentSession.id, {
        name: formData.trainingName,
        cohort: formData.cohort,
        startDate: formData.startDate,
        endDate: formData.endDate,
        scoringScale: {
          min: formData.minScore,
          max: formData.maxScore,
        },
        registrationOpen: formData.registrationOpen,
        allowNegativeScores: formData.allowNegativeScores,
        allowDecimalScores: formData.allowDecimalScores,
        scoringCategories: categories,
        status: formData.isArchived ? "completed" : "active",
      });

      await refreshCurrentSession();
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (currentSession) {
      setFormData({
        trainingName: currentSession.name || "",
        cohort: currentSession.cohort || "",
        startDate: currentSession.startDate || "",
        endDate: currentSession.endDate || "",
        minScore: currentSession.scoringScale?.min || -50,
        maxScore: currentSession.scoringScale?.max || 50,
        registrationOpen: currentSession.registrationOpen ?? true,
        allowNegativeScores: currentSession.allowNegativeScores ?? true,
        allowDecimalScores: currentSession.allowDecimalScores ?? false,
        isArchived: currentSession.status === "completed",
      });
      setCategories(
        currentSession.scoringCategories || { positive: {}, negative: {} }
      );
    }
    setHasChanges(false);
  };

  const copyJoinUrl = () => {
    const joinUrl = `${window.location.origin}/join/${currentSession?.joinCode}`;
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Category management
  const handleAddCategory = () => {
    if (!newCategoryForm.key || !newCategoryForm.name) {
      alert("Please fill in category key and name");
      return;
    }

    const key = newCategoryForm.key.toLowerCase().replace(/\s+/g, "_");
    const type = newCategoryForm.type;

    if (categories[type][key]) {
      alert("Category key already exists");
      return;
    }

    setCategories((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: {
          name: newCategoryForm.name,
          icon: newCategoryForm.icon,
          points: parseFloat(newCategoryForm.points),
          description: newCategoryForm.description,
        },
      },
    }));

    setNewCategoryForm({
      type: "positive",
      key: "",
      name: "",
      icon: "Star",
      points: 5,
      description: "",
    });
    setActiveModal(null);
    setHasChanges(true);
  };

  const handleAddTemplateCategory = (template, type) => {
    const key = template.key;
    if (categories[type][key]) {
      alert("Category already exists");
      return;
    }

    setCategories((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: {
          name: template.name,
          icon: template.icon,
          points: template.points,
          description: template.description,
        },
      },
    }));
    setHasChanges(true);
  };

  const handleEditCategory = (type, key) => {
    const category = categories[type][key];
    setEditingCategory({ type, key, ...category });
    setActiveModal("editCategory");
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;

    const { type, key, ...categoryData } = editingCategory;
    setCategories((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: categoryData,
      },
    }));

    setEditingCategory(null);
    setActiveModal(null);
    setHasChanges(true);
  };

  const handleDeleteCategory = (type, key) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    setCategories((prev) => {
      const newCategories = { ...prev };
      delete newCategories[type][key];
      return newCategories;
    });
    setHasChanges(true);
  };

  // CSV Bulk Upload
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
      alert("Please select a CSV file");
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
        const lines = csv.split(/\r?\n/).filter((line) => line.trim());

        if (lines.length === 0) {
          alert("CSV file is empty");
          return;
        }

        const headers = lines[0].split(",").map((h) =>
          h
            .trim()
            .replace(/^["']|["']$/g, "")
            .toLowerCase()
        );

        if (!headers.includes("name")) {
          alert("CSV must have a 'name' column");
          return;
        }

        const participants = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = [];
          let currentValue = "";
          let insideQuotes = false;

          for (let j = 0; j < line.length; j++) {
            const char = line[j];

            if (char === '"' || char === "'") {
              insideQuotes = !insideQuotes;
            } else if (char === "," && !insideQuotes) {
              values.push(currentValue.trim());
              currentValue = "";
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim());

          const participant = {};
          headers.forEach((header, index) => {
            const value = values[index] || "";
            participant[header] = value.replace(/^["']|["']$/g, "");
          });

          if (participant.name && participant.name.trim()) {
            participants.push({
              name: participant.name.trim(),
              email: participant.email?.trim() || null,
              phone: participant.phone?.trim() || null,
              department: participant.department?.trim() || null,
              team: participant.team?.trim() || null,
            });
          }
        }

        if (participants.length === 0) {
          alert("No valid participants found in CSV");
          return;
        }

        setCsvData(participants);
      } catch (err) {
        console.error("CSV parsing error:", err);
        alert("Failed to parse CSV file. Please check the format.");
      }
    };

    reader.onerror = () => {
      alert("Failed to read file");
    };

    reader.readAsText(file);
  };

  const handleBulkUpload = async () => {
    if (csvData.length === 0) {
      alert("No valid participants found in CSV");
      return;
    }

    if (!currentSession?.id) {
      alert("No session selected");
      return;
    }

    try {
      setUploadingBulk(true);
      const results = await participantService.bulkCreateParticipants(
        csvData,
        currentSession.id
      );

      setBulkResults(results);

      if (results.successful.length > 0) {
        await refreshCurrentSession();
      }
    } catch (err) {
      console.error("Error bulk uploading:", err);
      alert("Failed to upload participants");
    } finally {
      setUploadingBulk(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent =
      "name,email,phone,department,team\n" +
      "John Doe,john@example.com,+234 803 567 1711,Engineering,Team A\n" +
      "Jane Smith,jane@example.com,+234 815 982 0079,Marketing,Team B\n" +
      "Bob Johnson,,+233 24 688 0913,Sales,Team A\n" +
      "Alice Williams,alice@example.com,,,Team C";

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "participants_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Export functions
  const exportParticipants = async () => {
    try {
      const participants = await participantService.getSessionParticipants(
        currentSession.id
      );

      const headers = [
        "Name",
        "Email",
        "Phone",
        "Department",
        "Team",
        "Total Score",
      ];
      const rows = participants.map((p) => [
        p.name,
        p.email || "",
        p.phone || "",
        p.department || "",
        p.team || "",
        p.totalScore || 0,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentSession.name}_participants.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting participants:", error);
      alert("Failed to export participants");
    }
  };

  const exportLeaderboard = async () => {
    try {
      const participants = await participantService.getSessionParticipants(
        currentSession.id
      );
      const sorted = [...participants].sort(
        (a, b) => (b.totalScore || 0) - (a.totalScore || 0)
      );

      const headers = ["Rank", "Name", "Total Score", "Team"];
      const rows = sorted.map((p, i) => [
        i + 1,
        p.name,
        p.totalScore || 0,
        p.team || "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentSession.name}_leaderboard.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting leaderboard:", error);
      alert("Failed to export leaderboard");
    }
  };

  const duplicateSession = async () => {
    const newName = prompt(
      "Enter name for duplicated session:",
      `${currentSession.name} (Copy)`
    );
    if (!newName) return;

    try {
      await sessionService.cloneSession(
        currentSession.id,
        newName,
        currentSession.createdBy
      );
      alert("Session duplicated successfully! Check your sessions list.");
    } catch (error) {
      console.error("Error duplicating session:", error);
      alert("Failed to duplicate session");
    }
  };

  // Admin management
  const handleAddAdmin = async () => {
    if (!newAdminEmail || !newAdminEmail.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }

    try {
      // In a real implementation, you would:
      // 1. Look up the user by email
      // 2. Add their userId to sessionAdmins array
      // 3. Create a sessionParticipant record with role="sessionAdmin"

      alert(
        `Admin management: Would add ${newAdminEmail} as admin. Full implementation requires user lookup service.`
      );
      setNewAdminEmail("");
    } catch (error) {
      console.error("Error adding admin:", error);
      alert("Failed to add admin");
    }
  };

  const handleRemoveAdmin = async (adminId) => {
    if (adminId === currentSession.createdBy) {
      alert("Cannot remove session owner");
      return;
    }

    if (!confirm("Remove this admin?")) return;

    try {
      const updatedAdmins = currentSession.sessionAdmins.filter(
        (id) => id !== adminId
      );
      await sessionService.updateSession(currentSession.id, {
        sessionAdmins: updatedAdmins,
      });
      await refreshCurrentSession();
      alert("Admin removed successfully");
    } catch (error) {
      console.error("Error removing admin:", error);
      alert("Failed to remove admin");
    }
  };

  const SettingCard = ({
    icon: Icon,
    title,
    description,
    children,
    gradient,
  }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className={`p-4 ${gradient}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-white/80 text-sm truncate">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-4 md:p-6">{children}</div>
    </div>
  );

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <SettingsIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No session selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-fadeIn p-4 lg:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-2 flex items-center">
                <SettingsIcon className="h-6 lg:h-8 w-6 lg:w-8 mr-3" />
                Settings & Configuration
              </h2>
              <p className="text-gray-100 text-sm md:text-base lg:text-lg">
                Manage your training session preferences and scoring rules
              </p>
            </div>

            {hasChanges && (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={handleReset}
                  disabled={saving}
                  className="bg-white/20 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl hover:bg-white/30 transition-all duration-200 flex items-center justify-center space-x-2 text-sm md:text-base"
                >
                  <X className="h-4 w-4" />
                  <span>Reset</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-white text-gray-800 px-6 py-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 flex items-center justify-center space-x-2 font-medium shadow-lg disabled:opacity-50 text-sm md:text-base"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 lg:w-64 h-32 lg:h-64 bg-white/5 rounded-full -translate-y-16 lg:-translate-y-32 translate-x-16 lg:translate-x-32"></div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Training Information */}
        <SettingCard
          icon={Trophy}
          title="Training Details"
          description="Basic session information"
          gradient="bg-gradient-to-r from-green-500 to-emerald-600"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Training Name
              </label>
              <input
                type="text"
                value={formData.trainingName}
                onChange={(e) =>
                  handleInputChange("trainingName", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm md:text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cohort
              </label>
              <input
                type="text"
                value={formData.cohort}
                onChange={(e) => handleInputChange("cohort", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm md:text-base"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    handleInputChange("startDate", e.target.value)
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm md:text-base"
                />
              </div>
            </div>
          </div>
        </SettingCard>

        {/* Scoring Configuration */}
        <SettingCard
          icon={Sliders}
          title="Scoring Scale"
          description="Configure point ranges"
          gradient="bg-gradient-to-r from-blue-500 to-blue-600"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Score
                </label>
                <input
                  type="number"
                  value={formData.minScore}
                  onChange={(e) =>
                    handleInputChange("minScore", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Score
                </label>
                <input
                  type="number"
                  value={formData.maxScore}
                  onChange={(e) =>
                    handleInputChange("maxScore", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm md:text-base"
                />
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <p className="text-xs md:text-sm text-blue-700">
                <strong>Current Range:</strong> {formData.minScore} to +
                {formData.maxScore} points per category
              </p>
            </div>
          </div>
        </SettingCard>

        {/* Registration Link */}
        <SettingCard
          icon={Share2}
          title="Registration Link"
          description="Share this link for participants"
          gradient="bg-gradient-to-r from-purple-500 to-indigo-600"
        >
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
              <p className="text-xs md:text-sm text-purple-700 mb-3">
                Share this URL with participants:
              </p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="text"
                  value={`${window.location.origin}/join/${currentSession.joinCode}`}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-purple-300 rounded-lg text-xs md:text-sm"
                />
                <button
                  onClick={copyJoinUrl}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-1 justify-center text-sm md:text-base flex-shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 flex-shrink-0"></div>
              <span className="text-xs md:text-sm text-green-700 font-medium">
                Registration is currently{" "}
                {formData.registrationOpen ? "active" : "closed"}
              </span>
            </div>
          </div>
        </SettingCard>

        {/* Bulk Upload */}
        <SettingCard
          icon={Upload}
          title="Bulk Participant Upload"
          description="Upload via CSV file"
          gradient="bg-gradient-to-r from-orange-500 to-red-500"
        >
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
              <p className="text-xs text-orange-700 mb-2">
                <strong>Required:</strong> name column |{" "}
                <strong>Optional:</strong> email, phone, department, team
              </p>
              <button
                onClick={downloadTemplate}
                className="text-orange-700 hover:text-orange-800 text-xs font-medium underline"
              >
                Download CSV template
              </button>
            </div>

            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                dragActive
                  ? "border-orange-400 bg-orange-50"
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
                  <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
                  <h4 className="font-medium text-gray-900 text-sm">
                    {csvFile.name}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {csvData.length} participants ready
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center mt-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                    >
                      Choose different file
                    </button>
                    <button
                      onClick={handleBulkUpload}
                      disabled={uploadingBulk || csvData.length === 0}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {uploadingBulk ? (
                        <>
                          <Loader className="inline animate-spin h-3 w-3 mr-1" />
                          Uploading...
                        </>
                      ) : (
                        `Upload ${csvData.length} Participants`
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <FileText className="h-10 w-10 text-gray-400 mx-auto" />
                  <p className="text-xs text-gray-600">
                    Drag and drop CSV or click to browse
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                  >
                    Choose File
                  </button>
                </div>
              )}
            </div>

            {bulkResults && (
              <div className="space-y-2">
                {bulkResults.successful.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs text-green-700">
                      ✓ {bulkResults.successful.length} participants added
                    </p>
                  </div>
                )}
                {bulkResults.duplicates.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-700">
                      ⚠ {bulkResults.duplicates.length} duplicates skipped
                    </p>
                  </div>
                )}
                {bulkResults.failed.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs text-red-700">
                      ✕ {bulkResults.failed.length} participants failed
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </SettingCard>

        {/* Custom Score Categories */}
        <SettingCard
          icon={Target}
          title="Scoring Categories"
          description="Manage scoring categories"
          gradient="bg-gradient-to-r from-pink-500 to-rose-600"
        >
          <div className="space-y-4">
            <button
              onClick={() => setActiveModal("addCategory")}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white px-4 py-2.5 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2 font-medium text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Custom Category</span>
            </button>

            <button
              onClick={() => setActiveModal("categoryTemplates")}
              className="w-full bg-pink-100 hover:bg-pink-200 text-pink-700 px-4 py-2.5 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2 font-medium text-sm"
            >
              <FileText className="h-4 w-4" />
              <span>Choose from Templates</span>
            </button>

            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase">
                  Positive Categories
                </h4>
                <div className="space-y-2">
                  {Object.entries(categories.positive || {}).map(
                    ([key, category]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">
                            {category.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            +{category.points} points
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditCategory("positive", key)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteCategory("positive", key)
                            }
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                  {Object.keys(categories.positive || {}).length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-2">
                      No positive categories
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase">
                  Negative Categories
                </h4>
                <div className="space-y-2">
                  {Object.entries(categories.negative || {}).map(
                    ([key, category]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">
                            {category.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {category.points} points
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditCategory("negative", key)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteCategory("negative", key)
                            }
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                  {Object.keys(categories.negative || {}).length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-2">
                      No negative categories
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SettingCard>

        {/* Scoring Behavior */}
        <SettingCard
          icon={Zap}
          title="Scoring Behavior"
          description="Global scoring rules"
          gradient="bg-gradient-to-r from-amber-500 to-yellow-600"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div>
                <h4 className="font-medium text-gray-900 text-sm">
                  Allow Negative Scores
                </h4>
                <p className="text-xs text-gray-600">
                  Participants can have negative total scores
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.allowNegativeScores}
                  onChange={(e) =>
                    handleInputChange("allowNegativeScores", e.target.checked)
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div>
                <h4 className="font-medium text-gray-900 text-sm">
                  Allow Decimal Scores
                </h4>
                <p className="text-xs text-gray-600">
                  Enable fractional point values (e.g., 2.5 points)
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.allowDecimalScores}
                  onChange={(e) =>
                    handleInputChange("allowDecimalScores", e.target.checked)
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div>
                <h4 className="font-medium text-gray-900 text-sm">
                  Registration Status
                </h4>
                <p className="text-xs text-gray-600">
                  Allow new participants to join
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.registrationOpen}
                  onChange={(e) =>
                    handleInputChange("registrationOpen", e.target.checked)
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <h4 className="font-medium text-gray-900 text-sm">
                  Archive Session
                </h4>
                <p className="text-xs text-gray-600">
                  Mark session as completed
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.isArchived}
                  onChange={(e) =>
                    handleInputChange("isArchived", e.target.checked)
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
              </label>
            </div>
          </div>
        </SettingCard>

        {/* Export & Data Management */}
        <SettingCard
          icon={Download}
          title="Export & Data Management"
          description="Manage session data"
          gradient="bg-gradient-to-r from-cyan-500 to-teal-600"
        >
          <div className="space-y-3">
            <button
              onClick={exportParticipants}
              className="w-full bg-cyan-50 hover:bg-cyan-100 text-cyan-700 px-4 py-3 rounded-xl transition-colors duration-200 flex items-center space-x-3 border border-cyan-200 text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              <span>Export Participants CSV</span>
            </button>

            <button
              onClick={exportLeaderboard}
              className="w-full bg-cyan-50 hover:bg-cyan-100 text-cyan-700 px-4 py-3 rounded-xl transition-colors duration-200 flex items-center space-x-3 border border-cyan-200 text-sm font-medium"
            >
              <Trophy className="h-4 w-4" />
              <span>Export Leaderboard CSV</span>
            </button>

            <button
              onClick={duplicateSession}
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-xl transition-colors duration-200 flex items-center space-x-3 border border-blue-200 text-sm font-medium"
            >
              <Copy className="h-4 w-4" />
              <span>Duplicate Session</span>
            </button>

            <button
              onClick={() => setShowDeleteSessionConfirm(true)}
              className="w-full bg-red-50 hover:bg-red-100 text-red-700 px-4 py-3 rounded-xl transition-colors duration-200 flex items-center space-x-3 border border-red-200 text-sm font-medium"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Session</span>
            </button>
          </div>
        </SettingCard>

        {/* Access Control */}
        <SettingCard
          icon={Shield}
          title="Access Control & Permissions"
          description="Manage admins and moderators"
          gradient="bg-gradient-to-r from-indigo-500 to-purple-600"
        >
          <div className="space-y-4">
            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
              <h4 className="text-xs font-semibold text-indigo-900 mb-2">
                Current Admins
              </h4>
              <div className="space-y-2">
                {currentSession.sessionAdmins?.map((adminId, index) => (
                  <div
                    key={adminId}
                    className="flex items-center justify-between bg-white p-2 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">
                          Admin {index + 1}
                        </p>
                        <p className="text-xs text-gray-500">
                          {adminId === currentSession.createdBy
                            ? "Owner"
                            : "Admin"}
                        </p>
                      </div>
                    </div>
                    {adminId !== currentSession.createdBy && (
                      <button
                        onClick={() => handleRemoveAdmin(adminId)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add New Admin/Moderator
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
                <button
                  onClick={handleAddAdmin}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition-colors duration-200 flex items-center space-x-2 text-sm font-medium"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Admins can manage participants, scores, and settings
              </p>
            </div>
          </div>
        </SettingCard>
      </div>

      {/* Category Templates Modal */}
      {activeModal === "categoryTemplates" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Category Templates
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-emerald-700 mb-3">
                  Positive Categories
                </h4>
                <div className="space-y-2">
                  {categoryTemplates.positive.map((template) => (
                    <div
                      key={template.key}
                      className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {template.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {template.description}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-bold text-emerald-700">
                          +{template.points} pts
                        </div>
                        <button
                          onClick={() =>
                            handleAddTemplateCategory(template, "positive")
                          }
                          disabled={categories.positive[template.key]}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {categories.positive[template.key] ? "Added" : "Add"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-red-600 mb-3">
                  Negative Categories
                </h4>
                <div className="space-y-2">
                  {categoryTemplates.negative.map((template) => (
                    <div
                      key={template.key}
                      className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {template.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {template.description}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-bold text-red-700">
                          {template.points} pts
                        </div>
                        <button
                          onClick={() =>
                            handleAddTemplateCategory(template, "negative")
                          }
                          disabled={categories.negative[template.key]}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {categories.negative[template.key] ? "Added" : "Add"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setActiveModal(null)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {activeModal === "addCategory" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Add Category</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Type
                </label>
                <select
                  value={newCategoryForm.type}
                  onChange={(e) =>
                    setNewCategoryForm({
                      ...newCategoryForm,
                      type: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Key (unique identifier)
                </label>
                <input
                  type="text"
                  value={newCategoryForm.key}
                  onChange={(e) =>
                    setNewCategoryForm({
                      ...newCategoryForm,
                      key: e.target.value,
                    })
                  }
                  placeholder="e.g., teamwork"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newCategoryForm.name}
                  onChange={(e) =>
                    setNewCategoryForm({
                      ...newCategoryForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g., Teamwork"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points
                </label>
                <input
                  type="number"
                  value={newCategoryForm.points}
                  onChange={(e) =>
                    setNewCategoryForm({
                      ...newCategoryForm,
                      points: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newCategoryForm.description}
                  onChange={(e) =>
                    setNewCategoryForm({
                      ...newCategoryForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Brief description"
                  rows="2"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {activeModal === "editCategory" && editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Edit Category</h3>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setEditingCategory(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points
                </label>
                <input
                  type="number"
                  value={editingCategory.points}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      points: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editingCategory.description || ""}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      description: e.target.value,
                    })
                  }
                  rows="2"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setActiveModal(null);
                  setEditingCategory(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCategory}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Update Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Button for Mobile */}
      {hasChanges && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 flex space-x-3 z-50">
          <button
            onClick={handleReset}
            disabled={saving}
            className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-xl font-medium shadow-lg disabled:opacity-50"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl font-medium shadow-lg disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}

      {showDeleteSessionConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Delete Session?
            </h3>

            <p className="text-gray-600 text-center mb-4">
              This will permanently delete{" "}
              <strong>{currentSession.name}</strong> and all associated data.
              This action cannot be undone.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteSessionConfirm(false)}
                disabled={deletingSession}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSession}
                disabled={deletingSession}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {deletingSession ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
