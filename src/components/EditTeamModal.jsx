// src/components/EditTeamModal.jsx
import React, { useState, useEffect } from "react";
import {
  X,
  Users,
  CheckCircle,
  AlertCircle,
  Loader,
  Search,
  UserCheck,
  Edit,
} from "lucide-react";
import { ParticipantService } from "../services/participantService";

const EditTeamModal = ({
  isOpen,
  onClose,
  team,
  allParticipants,
  onTeamUpdated,
}) => {
  const [teamName, setTeamName] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const participantService = new ParticipantService();

  useEffect(() => {
    if (team && isOpen) {
      setTeamName(team.name);
      setSelectedParticipants(team.members.map((m) => m.id));
      setSearchTerm("");
      setError("");
      setSuccess("");
    }
  }, [team, isOpen]);

  const resetForm = () => {
    setTeamName("");
    setSelectedParticipants([]);
    setSearchTerm("");
    setError("");
    setSuccess("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const filteredParticipants = allParticipants.filter((p) => {
    const search = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(search) ||
      p.email?.toLowerCase().includes(search) ||
      p.department?.toLowerCase().includes(search)
    );
  });

  const toggleParticipant = (participantId) => {
    setSelectedParticipants((prev) =>
      prev.includes(participantId)
        ? prev.filter((id) => id !== participantId)
        : [...prev, participantId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!teamName.trim()) {
      setError("Team name is required");
      return;
    }

    if (selectedParticipants.length === 0) {
      setError("Please select at least one participant");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Get participants who need to be unassigned (were in team, now not selected)
      const currentMemberIds = team.members.map((m) => m.id);
      const toUnassign = currentMemberIds.filter(
        (id) => !selectedParticipants.includes(id)
      );

      // Get participants who need to be assigned (selected but not in team)
      const toAssign = selectedParticipants.filter(
        (id) => !currentMemberIds.includes(id)
      );

      // Unassign removed members
      await Promise.all(
        toUnassign.map((participantId) =>
          participantService.assignTeam(participantId, null)
        )
      );

      // Assign new members
      await Promise.all(
        toAssign.map((participantId) =>
          participantService.assignTeam(participantId, teamName.trim())
        )
      );

      // If team name changed, update all current members
      if (teamName.trim() !== team.name) {
        await Promise.all(
          selectedParticipants.map((participantId) =>
            participantService.assignTeam(participantId, teamName.trim())
          )
        );
      }

      setSuccess(
        `Team "${teamName}" updated with ${selectedParticipants.length} members!`
      );

      if (onTeamUpdated) {
        onTeamUpdated();
      }

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error("Error updating team:", err);
      setError(err.message || "Failed to update team");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !team) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Team</h2>
            <p className="text-sm text-gray-600 mt-1">
              Update team name and manage members
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Name *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Team Alpha, Red Team, Squad 1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Team Members *
              </label>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search participants..."
                />
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">
                  {selectedParticipants.length} participant
                  {selectedParticipants.length !== 1 ? "s" : ""} selected
                </span>
                {selectedParticipants.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedParticipants([])}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear Selection
                  </button>
                )}
              </div>

              <div className="border border-gray-200 rounded-xl max-h-80 overflow-y-auto">
                {filteredParticipants.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {filteredParticipants.map((participant) => {
                      const isSelected = selectedParticipants.includes(
                        participant.id
                      );
                      const wasInOriginalTeam = team.members.some(
                        (m) => m.id === participant.id
                      );

                      return (
                        <button
                          key={participant.id}
                          type="button"
                          onClick={() => toggleParticipant(participant.id)}
                          className={`w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                            isSelected ? "bg-blue-50" : ""
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? "bg-blue-600 border-blue-600"
                                : "border-gray-300"
                            }`}
                          >
                            {isSelected && (
                              <UserCheck className="h-4 w-4 text-white" />
                            )}
                          </div>

                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>

                          <div className="flex-1 text-left min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {participant.name}
                            </div>
                            <div className="text-sm text-gray-600 truncate">
                              {participant.email || "No email"}
                            </div>
                          </div>

                          <div className="flex flex-col items-end flex-shrink-0">
                            {participant.team &&
                              participant.team !== team.name && (
                                <span className="text-xs text-gray-500 mb-1">
                                  Current: {participant.team}
                                </span>
                              )}
                            {wasInOriginalTeam && (
                              <span className="text-xs text-blue-600 mb-1">
                                Original member
                              </span>
                            )}
                            <span
                              className={`text-sm font-semibold ${
                                (participant.totalScore || 0) >= 0
                                  ? "text-emerald-600"
                                  : "text-red-600"
                              }`}
                            >
                              {participant.totalScore || 0} pts
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No participants found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {success && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-6 flex-shrink-0 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={
                loading || !teamName.trim() || selectedParticipants.length === 0
              }
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin h-4 w-4" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  <span>
                    Update Team ({selectedParticipants.length} members)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTeamModal;
