class CallHistory {
  constructor(data) {
    this.id = data.id;
    this.agentId = data.agentId;
    this.agentName = data.agentName;
    this.transcript = data.transcript || [];
    this.duration = data.duration || 0;
    this.startTime = data.startTime || new Date().toISOString();
    this.endTime = data.endTime;
    this.status = data.status || 'completed';
  }

  toJSON() {
    return {
      id: this.id,
      agentId: this.agentId,
      agentName: this.agentName,
      transcript: this.transcript,
      duration: this.duration,
      startTime: this.startTime,
      endTime: this.endTime,
      status: this.status
    };
  }
}

module.exports = CallHistory;