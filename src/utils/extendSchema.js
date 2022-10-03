export const extendSchema = (Schema, definition, options) => {
    return new mongoose.Schema(
      Object.assign({}, Schema.obj, definition),
      options
    );
  } 