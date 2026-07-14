import SimpleMasterList from './SimpleMasterList';

const Designation = () => (
  <SimpleMasterList
    title="Roles"
    description="Manage staff roles (e.g. HOD, Assistant Professor, Non-Teaching Staff)"
    apiPath="/master/designations"
    nameKey="designation_name"
    singularLabel="Role"
  />
);

export default Designation;