import { products, resources, solutions } from "./data";
import { blogs } from "./blogs.mjs";
import { buildIndex } from "./searchEngine.mjs";
export const searchIndex = buildIndex({
  products,
  resources,
  solutions,
  blogs,
});
