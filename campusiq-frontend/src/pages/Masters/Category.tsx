import SimpleMasterList from './SimpleMasterList';

const Category = () => (
  <SimpleMasterList
    title="Designation"
    description="Manage complaint categories (also used as employee designations)"
    apiPath="/master/categories"
    nameKey="category_name"
    singularLabel="Designation"
  />
);

export default Category;