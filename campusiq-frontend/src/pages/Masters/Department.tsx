import SimpleMasterList from './SimpleMasterList';

const Department = () => (
  <SimpleMasterList
    title="Departments"
    description="Manage the departments used across employees and bookings"
    apiPath="/master/departments"
    nameKey="department_name"
    singularLabel="Department"
  />
);

export default Department;