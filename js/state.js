let db = {
  jobs: [],
  workers: [],
  vehicles: [],
  assignments: [],
  notes: [],
  absences: []
};
let weekStart = monday(new Date());
let selectedJobId = null;
let selectedWorkerId = null;
let selectedVehicleId = null;
let selectedAssignmentId = null;
let currentUser = null;
let realtimeSubscribed = false;
let canEdit = false; 
