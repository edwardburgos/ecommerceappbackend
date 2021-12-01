export default [
    `ALTER TABLE category_children ADD CONSTRAINT no_repeated_categories CHECK ("categoryId" != "CategoryChildId")`
]