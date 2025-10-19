// src/external/serpService.ts
/**
 * serpService.ts
 *
 * Small wrapper around the **SerpAPI** “Google Shopping” endpoint.
 * The function receives a product title / description (or both) and returns
 * an array of shopping URLs that match the product.
 *
 * The wrapper is deliberately tiny – only the parameters we need for Trove
 * are exposed. You can extend it later (e.g. pass `location`, `hl`, etc.).
 */

import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export interface SerpShoppingResult {
  title: string; // the title Google shows for the product
  link: string; // direct shopping URL (Amazon, Shopify, etc.)
  price?: string; // optional price that Google scraped
  source?: string; // e.g. “Amazon”, “Walmart”, … (if present)
  source_icon?: string; // url
  thumbnail?: string;
  serpapi_thumbnail?: string;
  delivery?: string;
}
if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}
const apiKey = process.env.SERP_API_KEY;
/**
 * Build the SERP request payload.
 *
 * @param query  – what the user is searching for (normally product name)
 * @param apiKey – your SerpAPI secret key (from env)
 *
 * @returns an array of `SerpShoppingResult` (or an empty array on error).
 */
export async function fetchShoppingUrls(
  query: string
): Promise<SerpShoppingResult[]> {
  if (!apiKey) {
    throw new Error("Missing SERP_API_KEY environment variable");
  }

  // -------------------------------------------------
  // SerpAPI “google” engine – we ask only for the first 10
  // shopping results.  The `tbm=shop` flag tells Google to
  // return the Shopping tab.
  // -------------------------------------------------
  const params = {
    q: query,
    tbm: "shop", // <-- Google Shopping
    num: 5, // ask for up to 10 results (Google may truncate)
    api_key: apiKey,
    // You can add `location`, `hl`, `gl`, … if you want geo‑specific results.
  };

  try {
    const { data } = await axios.get("https://serpapi.com/search", {
      params,
    });

    // const data = {
    //   search_metadata: {
    //     id: "68f3ef1aeb2bd1bee75ce504",
    //     status: "Success",
    //     json_endpoint:
    //       "https://serpapi.com/searches/dfee690906b02b9f/68f3ef1aeb2bd1bee75ce504.json",
    //     created_at: "2025-10-18 19:48:42 UTC",
    //     processed_at: "2025-10-18 19:48:42 UTC",
    //     google_shopping_url:
    //       "https://www.google.com/search?udm=28&q=Uniqlo+Pleated+Trousers&num=5&hl=en&gl=us",
    //     raw_html_file:
    //       "https://serpapi.com/searches/dfee690906b02b9f/68f3ef1aeb2bd1bee75ce504.html",
    //     total_time_taken: 4.11,
    //   },
    //   search_parameters: {
    //     engine: "google_shopping",
    //     q: "Uniqlo Pleated Trousers",
    //     google_domain: "google.com",
    //     hl: "en",
    //     gl: "us",
    //     num: "5",
    //     device: "desktop",
    //   },
    //   search_information: {
    //     query_displayed: "Uniqlo Pleated Trousers",
    //     shopping_results_state: "Results for exact spelling",
    //   },
    //   shopping_results: [
    //     {
    //       position: 1,
    //       title: "UNIQLO Men's Pleated Wide Pants",
    //       product_id: "6266015511773730422",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=6266015511773730422",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:6266015511773730422,headlineOfferDocid:17999028462967131449,imageDocid:6267610566977729456,gpcid:6145078773191752237,mid:576462511164041558,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiNjI2NjAxNTUxMTc3MzczMDQyMiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjE3OTk5MDI4NDYyOTY3MTMxNDQ5IiwiaW1hZ2VEb2NpZCI6IjYyNjc2MTA1NjY5Nzc3Mjk0NTYiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI2MTQ1MDc4NzczMTkxNzUyMjM3IiwibWlkIjoiNTc2NDYyNTExMTY0MDQxNTU4IiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiNjI2NjAxNTUxMTc3MzczMDQyMiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjE3OTk5MDI4NDYyOTY3MTMxNDQ5IiwiaW1hZ2VEb2NpZCI6IjYyNjc2MTA1NjY5Nzc3Mjk0NTYiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI2MTQ1MDc4NzczMTkxNzUyMjM3IiwibWlkIjoiNTc2NDYyNTExMTY0MDQxNTU4IiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //       source: "Uniqlo",
    //       source_icon:
    //         "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/6410f1fdac3761c04da6e77077f496f40d27ceae88cb6de0daadeed98be57b78.png",
    //       multiple_sources: true,
    //       price: "$49.90",
    //       extracted_price: 49.9,
    //       rating: null,
    //       thumbnail:
    //         "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSjdfC6hkxZsw3HpUWaFIQF7vVc_nT5YiflMUoY6sXRHAk4PjZCwFCn1fyqWdIEbrYT-Yxi2P7DYX5mDO32dVxoxx9mhYb763FJr5qLj1-GfhYdYQyFociS",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/yQJgHXicDcnbDoIgAADQLzIzU1dba02jy7po2QVfWoIEloDCEn-q_-lv6rye74dqLdXYtguOmk7qAls65_3eQ-m7ZqiHRGUrKqRk_DGtJ_8bz3Z4tEDHEpPQp0-TqdZdytPlDlYJCN5ndOOpBxl5bU8C-up6WM6ew7jMwhaE3CFdfcGred7A1IKGDeIgglevivbuAJ-NMGZUUZgHvgvWjVdvSsdaEAoxTDogEDv-AE0TPkQ",
    //       delivery: "Free delivery on $99+",
    //     },
    //     {
    //       position: 2,
    //       title: "UNIQLO Pleated Wide Brushed Jersey Trousers",
    //       product_id: "12824397898205488817",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=12824397898205488817",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:12824397898205488817,headlineOfferDocid:17038324915319025940,imageDocid:6225355268328441500,gpcid:9375764651562891955,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTI4MjQzOTc4OTgyMDU0ODg4MTciLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNzAzODMyNDkxNTMxOTAyNTk0MCIsImltYWdlRG9jaWQiOiI2MjI1MzU1MjY4MzI4NDQxNTAwIiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiOTM3NTc2NDY1MTU2Mjg5MTk1NSIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTI4MjQzOTc4OTgyMDU0ODg4MTciLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNzAzODMyNDkxNTMxOTAyNTk0MCIsImltYWdlRG9jaWQiOiI2MjI1MzU1MjY4MzI4NDQxNTAwIiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiOTM3NTc2NDY1MTU2Mjg5MTk1NSIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       source: "Uniqlo",
    //       source_icon:
    //         "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/6410f1fdac3761c04da6e77077f496f4f71a9cb38bec75bfed49604abb4ba9f5.png",
    //       price: "$49.90",
    //       extracted_price: 49.9,
    //       rating: null,
    //       thumbnail:
    //         "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRgx2yFDZ2I3l555T5Nff2DVWuqfI3PUam8rJAKe-83PF9IBBiki6DigZZvP8RdZcBMgv-4kNz0iCv6Ha_F1Kr_UH9kGMkIQO6hrWLW3m_QRHUe8287ty4uAYg",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/ptOC2HicDcnbEkJAAADQL3LJrWWmaci4JMIkkxejxdoRFptJf9Xn9Dd1Xs_301BKZo3jqh5OK6FVydB7z7NopgXFkIVDx83NQAju0X7c_U_Tg1K1YYxewmqZmeCKD1mWL3JQ14J5TZ9j7YphUnRgOupexQAxtFTXMHCLFROjLFtCEJcZNHy0MFIbvHl8WBSnyK2NN-WJo7a237rRWWmm9JSKXR7FTlIBAWzpKj31G_oBSAA80A",
    //       delivery: "Free delivery on $99+",
    //     },
    //     {
    //       position: 3,
    //       title: "UNIQLO Pleated Wide Trousers",
    //       product_id: "12388159153098237734",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=12388159153098237734",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:12388159153098237734,headlineOfferDocid:5196305422525650869,imageDocid:7575984553379814564,gpcid:8636182815236942291,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTIzODgxNTkxNTMwOTgyMzc3MzQiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiI1MTk2MzA1NDIyNTI1NjUwODY5IiwiaW1hZ2VEb2NpZCI6Ijc1NzU5ODQ1NTMzNzk4MTQ1NjQiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI4NjM2MTgyODE1MjM2OTQyMjkxIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTIzODgxNTkxNTMwOTgyMzc3MzQiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiI1MTk2MzA1NDIyNTI1NjUwODY5IiwiaW1hZ2VEb2NpZCI6Ijc1NzU5ODQ1NTMzNzk4MTQ1NjQiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI4NjM2MTgyODE1MjM2OTQyMjkxIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //       source: "Uniqlo",
    //       source_icon:
    //         "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/6410f1fdac3761c04da6e77077f496f48e893e6cf58a90858cc62ffa57908083.png",
    //       price: "$49.90",
    //       extracted_price: 49.9,
    //       rating: null,
    //       thumbnail:
    //         "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQiVHwjn-0xLQfSROlujcxRes0K6548kwVeXQj3KAgY9qIWhtdOxrR5qdDc6d4HaxRy2npkPsuMh9D6cYcY33kmKosT3HZKPYtkt8db8P4wu_lyaaywR7z_Zag",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/hqnzPHicDcndCoIwGADQJ0olzVSIEIQM-9EVld7E2mzqbE73idpb9Ti9TZ3b8_0UAFJ5up4L0k0ScjqDhzA0pgBDSTTSvHRVNFKWgq3b1f88_0DdDUnKSzhUYmaMu-R5Qse6r8iIcmVE9sJy-HDJb0llRj5L3XZ7LYAexw4tWhoQm1ohHtE0F5LHqt8XbmCTlKSmyV9Ro85mmEVxChwc-nBia-jv9YTxNKDl-55h9gMdVkB5",
    //       delivery: "Free delivery on $99+",
    //     },
    //     {
    //       position: 4,
    //       title: "UNIQLO Men's Pleated Wide Brushed Twill Pants",
    //       product_id: "11297698375259241597",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=11297698375259241597",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:11297698375259241597,headlineOfferDocid:12671672068006906150,imageDocid:15565683085076879053,rds:PC_6145078773191752237|PROD_PC_6145078773191752237,gpcid:6664702460424391224,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTEyOTc2OTgzNzUyNTkyNDE1OTciLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxMjY3MTY3MjA2ODAwNjkwNjE1MCIsImltYWdlRG9jaWQiOiIxNTU2NTY4MzA4NTA3Njg3OTA1MyIsInJkcyI6IlBDXzYxNDUwNzg3NzMxOTE3NTIyMzd8UFJPRF9QQ182MTQ1MDc4NzczMTkxNzUyMjM3IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiNjY2NDcwMjQ2MDQyNDM5MTIyNCIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTEyOTc2OTgzNzUyNTkyNDE1OTciLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxMjY3MTY3MjA2ODAwNjkwNjE1MCIsImltYWdlRG9jaWQiOiIxNTU2NTY4MzA4NTA3Njg3OTA1MyIsInJkcyI6IlBDXzYxNDUwNzg3NzMxOTE3NTIyMzd8UFJPRF9QQ182MTQ1MDc4NzczMTkxNzUyMjM3IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiNjY2NDcwMjQ2MDQyNDM5MTIyNCIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       source: "Uniqlo",
    //       source_icon:
    //         "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/6410f1fdac3761c04da6e77077f496f41ac79c333515c6bfee1fd7ac6d2c33ed.png",
    //       multiple_sources: true,
    //       price: "$49.90",
    //       extracted_price: 49.9,
    //       rating: 5,
    //       reviews: 1,
    //       thumbnail:
    //         "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTSDs9GQuVyO_RqWKVz2MSp4MW1Gd_998C0XrgtBpa0DF3ipcBZbTr36PF4Q1zvFVu6L3kvzCF6He8HYkRCvQBf8Diqwz39tAi8wsbzoO7uaZ_Cm4o7bgs9-Q",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/0uj3yXicDcltCoIwAADQE6mZYlsQoRMN-pyGVn_ETbMhuemm0U7VdbpNvb_v-3koJeTSsuqODm-h6spQpLPNRqpSMWpS_rTkgwvBumbdr_639A8VjOk5DSWM8Zi9j0XS59tMz_epcPe5HVcFhADNLkOjAlHOwshhggY3ch4c7xS52NZTlI3ezmknjSJvU4PNtU3QhIM7CFn_0g5UPgMvSTQ_LsbyVqCnyxekkdDAP1xrPd4",
    //       delivery: "Free delivery on $99+",
    //     },
    //     {
    //       position: 5,
    //       title: "UNIQLO Men's Pleated Wide Tweed Pants",
    //       product_id: "2780096189966895285",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=2780096189966895285",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:2780096189966895285,headlineOfferDocid:10164452482736688498,imageDocid:7252659062843790338,rds:PC_6145078773191752237|PROD_PC_6145078773191752237,gpcid:2019237282848385776,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMjc4MDA5NjE4OTk2Njg5NTI4NSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjEwMTY0NDUyNDgyNzM2Njg4NDk4IiwiaW1hZ2VEb2NpZCI6IjcyNTI2NTkwNjI4NDM3OTAzMzgiLCJyZHMiOiJQQ182MTQ1MDc4NzczMTkxNzUyMjM3fFBST0RfUENfNjE0NTA3ODc3MzE5MTc1MjIzNyIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IjIwMTkyMzcyODI4NDgzODU3NzYiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ==",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMjc4MDA5NjE4OTk2Njg5NTI4NSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjEwMTY0NDUyNDgyNzM2Njg4NDk4IiwiaW1hZ2VEb2NpZCI6IjcyNTI2NTkwNjI4NDM3OTAzMzgiLCJyZHMiOiJQQ182MTQ1MDc4NzczMTkxNzUyMjM3fFBST0RfUENfNjE0NTA3ODc3MzE5MTc1MjIzNyIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IjIwMTkyMzcyODI4NDgzODU3NzYiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ%3D%3D",
    //       source: "Uniqlo",
    //       source_icon:
    //         "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/6410f1fdac3761c04da6e77077f496f44ad57d158dce36f1be7fdda9d2fff293.png",
    //       multiple_sources: true,
    //       price: "$49.90",
    //       extracted_price: 49.9,
    //       rating: 5,
    //       reviews: 1,
    //       thumbnail:
    //         "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTACiMHMsJSA05o60BSyDkMbmhTNiwN-0c44SmH_SC3Fbb3yRqOjkLRQqEy2i0xJCeyeWhyDJXDpn80Wa6-0jvkIGdc-eTGxV56ElEv3ltKCj98cNbEzGx9d2M",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/aw1M3nicDcn_DkJAAADgJzpuxLC1JkSKFpb-a-7cOD9PbnK9VY_T29T37_f91Jyz2ZJlMuCnYJyUgKNBkaqZF5xiCY-9PNcjY3SodtP2f5Ydl6aPM9uhURDNYWpDbdThPhVuG6G-zmL6igHEm03aB4_UUQ8IqSKZLk17Tq6TJxQK19AhguS1cMO7ywYD5oUOYLO0R7_EgGT-etN0r_MWteMnpzENHCPv7a9mqUQ_gN09ng",
    //       delivery: "Free delivery on $99+",
    //     },
    //     {
    //       position: 6,
    //       title: "UNIQLO Men's Easy Wide Tapered Pants",
    //       product_id: "3409670397052740201",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=3409670397052740201",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:3409670397052740201,headlineOfferDocid:6210970290116131558,imageDocid:11401667544717625093,gpcid:7993548557011322291,mid:576462834460326842,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMzQwOTY3MDM5NzA1Mjc0MDIwMSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjYyMTA5NzAyOTAxMTYxMzE1NTgiLCJpbWFnZURvY2lkIjoiMTE0MDE2Njc1NDQ3MTc2MjUwOTMiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI3OTkzNTQ4NTU3MDExMzIyMjkxIiwibWlkIjoiNTc2NDYyODM0NDYwMzI2ODQyIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMzQwOTY3MDM5NzA1Mjc0MDIwMSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjYyMTA5NzAyOTAxMTYxMzE1NTgiLCJpbWFnZURvY2lkIjoiMTE0MDE2Njc1NDQ3MTc2MjUwOTMiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI3OTkzNTQ4NTU3MDExMzIyMjkxIiwibWlkIjoiNTc2NDYyODM0NDYwMzI2ODQyIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //       source: "Uniqlo",
    //       source_icon:
    //         "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/6410f1fdac3761c04da6e77077f496f4d6d55a2f880fac47e8159660648548fe.png",
    //       multiple_sources: true,
    //       price: "$39.90",
    //       extracted_price: 39.9,
    //       old_price: "Was $50",
    //       extracted_old_price: 50,
    //       rating: null,
    //       thumbnail:
    //         "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcRldqDtUY_7n6wiZi8zan4z4oinZxSrYrBImLwyEuImxE9waT3mlJNNu8YsLVP_W0Kc2p-VhFGGDZ7QQmj-DcOCw_39wdbyGX3W0v1BjKH1ke5oS_7wXfAFKFdk",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/VjTgF3icDcnbEoFAAADQL0oSuswYgxRqIvd62cluarHb1m5WPsvf-BvO6_l-CiEYt1U1o7BumciQIi5U6-RcpALDDiyJyouSMUzzcTX6nz0JkeXB7QNVjjjEwKBDiRNsvlPaf_dLTJPXro7r6ZIEsp03S_KaWzLd6-SxCsPGjHlw3IBT14c9phwL1_OcxIgiclMcuJ5JoFsSXVrvrJ-6T2168xfaPRuUO2DI83Xi-i66_wCHGD-3",
    //       tag: "20% OFF",
    //       extensions: ["20% OFF"],
    //       delivery: "Free delivery on $99+",
    //     },
    //     {
    //       position: 7,
    //       title: "Women's Pleated Wide Pants",
    //       product_id: "10784301126471686940",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=10784301126471686940",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:10784301126471686940,headlineOfferDocid:8713100148060839502,imageDocid:13758893111687634710,rds:PC_2254760895942242341|PROD_PC_2254760895942242341,gpcid:2254760895942242341,mid:576462838974184480,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTA3ODQzMDExMjY0NzE2ODY5NDAiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiI4NzEzMTAwMTQ4MDYwODM5NTAyIiwiaW1hZ2VEb2NpZCI6IjEzNzU4ODkzMTExNjg3NjM0NzEwIiwicmRzIjoiUENfMjI1NDc2MDg5NTk0MjI0MjM0MXxQUk9EX1BDXzIyNTQ3NjA4OTU5NDIyNDIzNDEiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIyMjU0NzYwODk1OTQyMjQyMzQxIiwibWlkIjoiNTc2NDYyODM4OTc0MTg0NDgwIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTA3ODQzMDExMjY0NzE2ODY5NDAiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiI4NzEzMTAwMTQ4MDYwODM5NTAyIiwiaW1hZ2VEb2NpZCI6IjEzNzU4ODkzMTExNjg3NjM0NzEwIiwicmRzIjoiUENfMjI1NDc2MDg5NTk0MjI0MjM0MXxQUk9EX1BDXzIyNTQ3NjA4OTU5NDIyNDIzNDEiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIyMjU0NzYwODk1OTQyMjQyMzQxIiwibWlkIjoiNTc2NDYyODM4OTc0MTg0NDgwIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //       source: "GU USA",
    //       source_icon:
    //         "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/6410f1fdac3761c04da6e77077f496f43323b63f456ec26636f62285f166efdf.png",
    //       price: "$29.90",
    //       extracted_price: 29.9,
    //       rating: 5,
    //       reviews: 6,
    //       thumbnail:
    //         "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcSjfTNk2SxqvuUjXjJfrtgtLhqQilgSAlalD0hmDSp5T6WxsMjMaCrWGm2GwLHZZZvGHAem398zVlFHZKiYrgAXTESelZBaJGpXXXVfZhx9OUxUf2GIeJwBNw",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/jZ2du3icDcnhEkIwAADgJ4pOVxd3XUdqErpuZO2fmI2GYaGeqtfpber7-30_TErRG6pK6rR7CUmymbzXmkJ7mcgiVdKmUnvWCFHUdNtu_meYQaaDFJZ5GDw0OLXDMypR6eadpNJj7aXgFJo84facVTYUy3AVT71f-smui0GlgdFzMMYDcExSLfT1-8oPDj4Vt46aKNxDwrGVuEAghK45ZpN-jqYo18CRuKMVjD82v0BB",
    //       delivery: "Free delivery on $79+",
    //     },
    //     {
    //       position: 8,
    //       title: "Gap Men's 365 Relaxed Pleated Trousers",
    //       product_id: "5615959951526117643",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=5615959951526117643",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:5615959951526117643,headlineOfferDocid:2874530347055751576,imageDocid:13130760161059119167,rds:PC_13739976556552862639|PROD_PC_13739976556552862639,gpcid:13739976556552862639,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiNTYxNTk1OTk1MTUyNjExNzY0MyIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjI4NzQ1MzAzNDcwNTU3NTE1NzYiLCJpbWFnZURvY2lkIjoiMTMxMzA3NjAxNjEwNTkxMTkxNjciLCJyZHMiOiJQQ18xMzczOTk3NjU1NjU1Mjg2MjYzOXxQUk9EX1BDXzEzNzM5OTc2NTU2NTUyODYyNjM5IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiMTM3Mzk5NzY1NTY1NTI4NjI2MzkiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ==",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiNTYxNTk1OTk1MTUyNjExNzY0MyIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjI4NzQ1MzAzNDcwNTU3NTE1NzYiLCJpbWFnZURvY2lkIjoiMTMxMzA3NjAxNjEwNTkxMTkxNjciLCJyZHMiOiJQQ18xMzczOTk3NjU1NjU1Mjg2MjYzOXxQUk9EX1BDXzEzNzM5OTc2NTU2NTUyODYyNjM5IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiMTM3Mzk5NzY1NTY1NTI4NjI2MzkiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ%3D%3D",
    //       source: "Gap",
    //       source_icon:
    //         "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/6410f1fdac3761c04da6e77077f496f45772a01e15c87c37b60c645300a299ce.png",
    //       multiple_sources: true,
    //       price: "$59.99",
    //       extracted_price: 59.99,
    //       old_price: "$80",
    //       extracted_old_price: 80,
    //       rating: 4.6,
    //       reviews: 139,
    //       thumbnail:
    //         "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQMLC40S0Znfdv8vD00lkwew3TPjuI2kuBl3WkRHYyvardi5MRFZEoOs9WQa_PpidC3Rt9jV5R_Kjb_EDn3aENGMI1iX8n_WN1GU6QnFIzA2_Ec0tr9t6CmttD4",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/WaYRMXicDcndEoFAGADQJ6Jly8iMMVTSUCo_0c1O7YYttlWfmjyWt_E2nNvz_dwAZD1RlEzQqpOQsR6kAvevNSTAaZ-WD6W-lVJycZ09p_-bzD2m2zRwN4aKdigWF9aMGxOhe9FmLd77-csZFq_FHUdFuDp3TVIxrrnhMrbKba1HQUJ8yZmBQ9DzoxaSdZ4SyxQ4sTzbdQb8NBYk8gb2YRSIpfOeD4lFEVQ6jIwHgKn-AAbsPoc",
    //       tag: "24% OFF",
    //       extensions: ["24% OFF"],
    //     },
    //     {
    //       position: 9,
    //       title: "UNIQLO Women's Smart Wide Pants",
    //       product_id: "12701340143039517743",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=12701340143039517743",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:12701340143039517743,headlineOfferDocid:1978750400050563894,imageDocid:10906581356510260862,gpcid:695878116379558140,mid:576462865235370627,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTI3MDEzNDAxNDMwMzk1MTc3NDMiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxOTc4NzUwNDAwMDUwNTYzODk0IiwiaW1hZ2VEb2NpZCI6IjEwOTA2NTgxMzU2NTEwMjYwODYyIiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiNjk1ODc4MTE2Mzc5NTU4MTQwIiwibWlkIjoiNTc2NDYyODY1MjM1MzcwNjI3IiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTI3MDEzNDAxNDMwMzk1MTc3NDMiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxOTc4NzUwNDAwMDUwNTYzODk0IiwiaW1hZ2VEb2NpZCI6IjEwOTA2NTgxMzU2NTEwMjYwODYyIiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiNjk1ODc4MTE2Mzc5NTU4MTQwIiwibWlkIjoiNTc2NDYyODY1MjM1MzcwNjI3IiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //       source: "Uniqlo",
    //       source_icon:
    //         "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/6410f1fdac3761c04da6e77077f496f4c64c70fe1bc24a450ec872fd3db5368b.png",
    //       multiple_sources: true,
    //       price: "$49.90",
    //       extracted_price: 49.9,
    //       rating: null,
    //       thumbnail:
    //         "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcRNOoL2XPihLuLYVFYLa458CpHrffO2kPfj_zXD-bN6w9iXDLWyyysWI0uQcXVV1TMWue0hYEHt1hz0_DH3fn-_MJZJ5ZsLzcdjUYQ4VV_YyJUstSYlIZkmGA",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/k3ptYnicDclJDoIwAADAF7EKRk2MMaIsqSgqhXIhUJYCCtWWmPIqv-NvdK7z_RDOKVspStnjl6C8LCSe97pcM57xBst4eCiMDJQ2fb15rv-32vrF0sYX_zQAPT43BIwAwQMCmWEudtR5VdVJ785Vm06xJeX-_L1sYgtEQggWueoY4BhC7XaMxlIlaO9wjUxqajmzqpfSo5d4ZsLAhIs2RIEBYYqEFzJ-RXc36R729geSyz7B",
    //       delivery: "Free delivery on $99+",
    //     },
    //     {
    //       position: 10,
    //       title: "UNIQLO Men's Wide Straight Pants",
    //       product_id: "11110557499202407310",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=11110557499202407310",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:11110557499202407310,headlineOfferDocid:18166128534242269080,imageDocid:6340223994196214347,gpcid:3159230359268897035,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTExMTA1NTc0OTkyMDI0MDczMTAiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxODE2NjEyODUzNDI0MjI2OTA4MCIsImltYWdlRG9jaWQiOiI2MzQwMjIzOTk0MTk2MjE0MzQ3IiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiMzE1OTIzMDM1OTI2ODg5NzAzNSIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTExMTA1NTc0OTkyMDI0MDczMTAiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxODE2NjEyODUzNDI0MjI2OTA4MCIsImltYWdlRG9jaWQiOiI2MzQwMjIzOTk0MTk2MjE0MzQ3IiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiMzE1OTIzMDM1OTI2ODg5NzAzNSIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       source: "Uniqlo",
    //       source_icon:
    //         "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/6410f1fdac3761c04da6e77077f496f42445c5e387eaf56a87ea9b40f1bbdc56.png",
    //       price: "$59.90",
    //       extracted_price: 59.9,
    //       rating: null,
    //       thumbnail:
    //         "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcRtKaVrPV7FserWtaiY6fLC3tlQ48LxkxgodCCDyJTb-Zcz7rdzXznZPmDWZ5GH2de3Z5cDj-z513XzhuPp92H4WmARL_DPoEj357Cs8bA77VSZitjpl9UEObQ",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/Yb_z43icDcndCoIwGADQJzKpaUshQtSKklIrtd2EbuZPqct9ge6tepzeps7t-X5KAC5MVc1b2o8ccqZA1qJJISCFik5o16ii7Div2mL1Wv7PtA7M2NAQ9mnU-xFei7yPIa2u87tnI3gG2sIbHkPRMdt2xt05UwiVuGcykS3xGycm-mY7YzkiOnVqRepTlMjy7XNjttXixgq9m-N3bo10bItFZmEcnUgFNX8aF_eYBT8BKz6K",
    //       delivery: "Free delivery on $99+",
    //     },
    //     {
    //       position: 11,
    //       title: "UNIQLO Men's Pleated Straight Pants",
    //       product_id: "1300387154636292182",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=1300387154636292182",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:1300387154636292182,headlineOfferDocid:4193598877734354056,imageDocid:749993239175944720,gpcid:18174444681353132707,mid:576462846156928077,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTMwMDM4NzE1NDYzNjI5MjE4MiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjQxOTM1OTg4Nzc3MzQzNTQwNTYiLCJpbWFnZURvY2lkIjoiNzQ5OTkzMjM5MTc1OTQ0NzIwIiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiMTgxNzQ0NDQ2ODEzNTMxMzI3MDciLCJtaWQiOiI1NzY0NjI4NDYxNTY5MjgwNzciLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ==",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTMwMDM4NzE1NDYzNjI5MjE4MiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjQxOTM1OTg4Nzc3MzQzNTQwNTYiLCJpbWFnZURvY2lkIjoiNzQ5OTkzMjM5MTc1OTQ0NzIwIiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiMTgxNzQ0NDQ2ODEzNTMxMzI3MDciLCJtaWQiOiI1NzY0NjI4NDYxNTY5MjgwNzciLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ%3D%3D",
    //       source: "Uniqlo",
    //       source_icon:
    //         "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/6410f1fdac3761c04da6e77077f496f4b0021b39c990bd184c94a00ad459782b.png",
    //       price: "$59.90",
    //       extracted_price: 59.9,
    //       rating: null,
    //       thumbnail:
    //         "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSj9KxNqEXInVUkI1sgFZa3yfLXWl43oBG1FAtIruUZlfdcsVb7e_FK8G_XCqgK1vvQyA0EOcaR3-pVgJnz-J9WuPQn5f_EpUjpx_gjGA2dxh-cbnpzFm3VKrTe",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/QQ3HSHicDcltD0JAAADgX3ReUiu21tQwNKXyMl-MwyHOccfws_o3_Zt6vj7fT8kYoQrP5xgOC2F5BliKBQ5RlrAKcrBreVp2hFQYnfrj_xTVyWQDPmvZnp1eC03se29TpEiPEmkprmHQbKXubIi6ysxh9KKmyCD1030e6_bBiMNLj2xxmtxFFbQbTB4SID6y8AosORjvLt4VsUa8mswxqg11k80lgCkmq95Kvj288h8wpD_6",
    //       delivery: "Free delivery on $99+",
    //     },
    //     {
    //       position: 12,
    //       title: "Women's uniqlo us Culottes Dark",
    //       product_id: "3035030343210790161",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=3035030343210790161",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:3035030343210790161,headlineOfferDocid:3819994991844841464,imageDocid:7349895248470776851,gpcid:17282904561206251388,mid:576462863764454494,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMzAzNTAzMDM0MzIxMDc5MDE2MSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjM4MTk5OTQ5OTE4NDQ4NDE0NjQiLCJpbWFnZURvY2lkIjoiNzM0OTg5NTI0ODQ3MDc3Njg1MSIsInJkcyI6IiIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IjE3MjgyOTA0NTYxMjA2MjUxMzg4IiwibWlkIjoiNTc2NDYyODYzNzY0NDU0NDk0IiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMzAzNTAzMDM0MzIxMDc5MDE2MSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjM4MTk5OTQ5OTE4NDQ4NDE0NjQiLCJpbWFnZURvY2lkIjoiNzM0OTg5NTI0ODQ3MDc3Njg1MSIsInJkcyI6IiIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IjE3MjgyOTA0NTYxMjA2MjUxMzg4IiwibWlkIjoiNTc2NDYyODYzNzY0NDU0NDk0IiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //       source: "Uniqlo",
    //       source_icon:
    //         "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/6410f1fdac3761c04da6e77077f496f448aa8366829faf529b1e0234099e80cd.png",
    //       price: "$49.90",
    //       extracted_price: 49.9,
    //       rating: null,
    //       thumbnail:
    //         "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcSdw3-T3XejmOhBz1CfEwbyOG7IRkz3KPPmdF9CKHOFasYMPsatOPEF8p41mml3IO1-WyrasSAUWh32Y3uFX9vmosi-lA08QVHNnxGcoBvYSFfSgafZ-oxeoxk",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/RJWxNnicDcltDoIgAADQE5EZbaVba9rEnEssK7N_iJ8lQkKm3arjdJt6f9_3UyklpKlpeUu7Uag8Aypt4aSUiqiaTihnmqy4EHVbrh-r_5lWkBkujbIXBEd4yW8MV_Zb3xTOKx2xu_AO9zf0w5BlyNj4W4yITHahJAqHDlqKuc5YAz2sg3jsiIysU1zBWQKf6GL0jMsaNNZ0uT9vg3ZwKbf7JEJFVJLiCviQ8-H-A7RWPvI",
    //       delivery: "Free delivery on $99+",
    //     },
    //     {
    //       position: 13,
    //       title: "UNIQLO Smart Wide Pants",
    //       product_id: "1133663139398365820",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=1133663139398365820",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:1133663139398365820,headlineOfferDocid:3149275127690438073,imageDocid:16313298076582141216,gpcid:2032437002227424200,mid:576462900883227159,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTEzMzY2MzEzOTM5ODM2NTgyMCIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjMxNDkyNzUxMjc2OTA0MzgwNzMiLCJpbWFnZURvY2lkIjoiMTYzMTMyOTgwNzY1ODIxNDEyMTYiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIyMDMyNDM3MDAyMjI3NDI0MjAwIiwibWlkIjoiNTc2NDYyOTAwODgzMjI3MTU5IiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTEzMzY2MzEzOTM5ODM2NTgyMCIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjMxNDkyNzUxMjc2OTA0MzgwNzMiLCJpbWFnZURvY2lkIjoiMTYzMTMyOTgwNzY1ODIxNDEyMTYiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIyMDMyNDM3MDAyMjI3NDI0MjAwIiwibWlkIjoiNTc2NDYyOTAwODgzMjI3MTU5IiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //       source: "Uniqlo",
    //       source_icon:
    //         "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/6410f1fdac3761c04da6e77077f496f45b09b024153781919b1ec3a289b9064b.png",
    //       price: "$49.90",
    //       extracted_price: 49.9,
    //       rating: null,
    //       thumbnail:
    //         "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcT8vaMwPm4_oYBTBAPrGqR5fcQrsw2kXQn4mnl4Kx_n5xXnNFHRV88Rlc3l-Dl_BmO3RTx01K6RQBY6HP_9GbFYq8X6ZPlCrhAz1gnHp8yx6JWreRF2Hpvh1h4",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/hT0xfXicDcltCoIwAADQE5Uf6ZhChBY6ikyHlPZHdJqT5pxzlHWrjtNt6v193w9VSkyupjWcyJdQTb1QFdeX7aRK1ZElGXptooMQHW834_p_rhfVTkhS-CiPz7i3iiH3U9-LZThi-0YSOT3Ne5Zwq-fMOswFt-eMRwHCZwgxIyu22LHC708rnM66cQA48XOA4sIJqyAfYQauMdtK6r2NliMBXzPYX2SDAxOJBzWo9QPUVz5Q",
    //       delivery: "Free delivery on $99+",
    //     },
    //     {
    //       position: 14,
    //       title: "Abercrombie & Fitch Men's Pleated Baggy Trousers",
    //       product_id: "2259191358912177247",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=2259191358912177247",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:2259191358912177247,headlineOfferDocid:10167867719621443413,imageDocid:13649594294196968696,rds:PC_4000360761265379451|PROD_PC_4000360761265379451,gpcid:4000360761265379451,mid:576462861877998729,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMjI1OTE5MTM1ODkxMjE3NzI0NyIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjEwMTY3ODY3NzE5NjIxNDQzNDEzIiwiaW1hZ2VEb2NpZCI6IjEzNjQ5NTk0Mjk0MTk2OTY4Njk2IiwicmRzIjoiUENfNDAwMDM2MDc2MTI2NTM3OTQ1MXxQUk9EX1BDXzQwMDAzNjA3NjEyNjUzNzk0NTEiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI0MDAwMzYwNzYxMjY1Mzc5NDUxIiwibWlkIjoiNTc2NDYyODYxODc3OTk4NzI5IiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMjI1OTE5MTM1ODkxMjE3NzI0NyIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjEwMTY3ODY3NzE5NjIxNDQzNDEzIiwiaW1hZ2VEb2NpZCI6IjEzNjQ5NTk0Mjk0MTk2OTY4Njk2IiwicmRzIjoiUENfNDAwMDM2MDc2MTI2NTM3OTQ1MXxQUk9EX1BDXzQwMDAzNjA3NjEyNjUzNzk0NTEiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI0MDAwMzYwNzYxMjY1Mzc5NDUxIiwibWlkIjoiNTc2NDYyODYxODc3OTk4NzI5IiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //       source: "Abercrombie & Fitch",
    //       source_icon:
    //         "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/6410f1fdac3761c04da6e77077f496f42132fa33129bfddb9789d6fbe34fc384.png",
    //       price: "$90.00",
    //       extracted_price: 90,
    //       rating: 4.8,
    //       reviews: 68,
    //       thumbnail:
    //         "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcTasfYwqNE5yVvAyae3zAfIfIySTKKOQdPqFsLa5zH6nt3HmSUxVVbg4V8bIZSMlJP_KqbxGa4xTnDAh877p88hRBlaW393_Gmz3MVqWiagisykk2QVOJZZUSw",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/-vrxcXicDclJDoIwAADAFwnGioCJMRgVEMGlUCIXUnYi1NY2SvmVz_E3Otf5fhohKF-qaknyp6SiLCYiI1Ol5gKLNlfyR6_y5kFpS-o1W_1vaQWFaech5tXtzYKdJtHLkrgEo1W5lSth6HmnS3Fme37E2ugsiABOD6MBoayeIyNzE-h3h3PqsWyw8XwIydZqDF2nhtFcNx2OgQlSux-Bj1jc4rrl8n6fXdDpkCQRfP8AI_E_sg",
    //       delivery: "Free delivery on $99+",
    //     },
    //     {
    //       position: 15,
    //       title: "Gap Women's 365 High Rise Pleated Trousers",
    //       product_id: "5825777555185949582",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=5825777555185949582",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:5825777555185949582,headlineOfferDocid:9426610860187791216,imageDocid:8993083448015146743,rds:PC_2704597407960065163|PROD_PC_2704597407960065163,gpcid:2704597407960065163,mid:576462834871374860,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiNTgyNTc3NzU1NTE4NTk0OTU4MiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6Ijk0MjY2MTA4NjAxODc3OTEyMTYiLCJpbWFnZURvY2lkIjoiODk5MzA4MzQ0ODAxNTE0Njc0MyIsInJkcyI6IlBDXzI3MDQ1OTc0MDc5NjAwNjUxNjN8UFJPRF9QQ18yNzA0NTk3NDA3OTYwMDY1MTYzIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiMjcwNDU5NzQwNzk2MDA2NTE2MyIsIm1pZCI6IjU3NjQ2MjgzNDg3MTM3NDg2MCIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiNTgyNTc3NzU1NTE4NTk0OTU4MiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6Ijk0MjY2MTA4NjAxODc3OTEyMTYiLCJpbWFnZURvY2lkIjoiODk5MzA4MzQ0ODAxNTE0Njc0MyIsInJkcyI6IlBDXzI3MDQ1OTc0MDc5NjAwNjUxNjN8UFJPRF9QQ18yNzA0NTk3NDA3OTYwMDY1MTYzIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiMjcwNDU5NzQwNzk2MDA2NTE2MyIsIm1pZCI6IjU3NjQ2MjgzNDg3MTM3NDg2MCIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       source: "Gap",
    //       source_icon:
    //         "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/6410f1fdac3761c04da6e77077f496f4b6d8cf7e46535f51fec1976c0e072983.png",
    //       multiple_sources: true,
    //       price: "$89.95",
    //       extracted_price: 89.95,
    //       rating: 4.5,
    //       reviews: 127,
    //       thumbnail:
    //         "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQ1s2W__a0u4PlPe8lO1GBB8ezkLDeg4Le-0tZsSPQQXIT87q3uUfu1FhIne04GUKa79fM0XClCgYAmV2fjgssQMY_ZxGQgnUuJsr1ZaWN_TCLExFWUNsY8PA",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/NauYbXicDclbCoJAFADQFfkWNCFCLcUyc0jz8SOm41jZ-LgjWKtqO-2mzu_5flrGBjAEAdNqeg0M1xy7UoUnwEp2q_iqfwrQ9sNwo2Qzrv9nmEG9ciskgZwURSnOatiFWO9OkmtZOn4__C0mqo85keVwDhFKvUjXRmWOm1lyWo9iUXXjQ6mtmqOY2p1NMvN5kZs7AUDHrMgXFxEaz3uYpLxMgiKy_d3iJHEAmR6aP0J4PZw",
    //     },
    //     {
    //       position: 16,
    //       title: "UNIQLO Wide Brushed Jersey Pants",
    //       product_id: "9430915093705899638",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=9430915093705899638",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:9430915093705899638,headlineOfferDocid:2372175699649628790,imageDocid:16838580922889307730,gpcid:18052009837808252419,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiOTQzMDkxNTA5MzcwNTg5OTYzOCIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjIzNzIxNzU2OTk2NDk2Mjg3OTAiLCJpbWFnZURvY2lkIjoiMTY4Mzg1ODA5MjI4ODkzMDc3MzAiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIxODA1MjAwOTgzNzgwODI1MjQxOSIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiOTQzMDkxNTA5MzcwNTg5OTYzOCIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjIzNzIxNzU2OTk2NDk2Mjg3OTAiLCJpbWFnZURvY2lkIjoiMTY4Mzg1ODA5MjI4ODkzMDc3MzAiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIxODA1MjAwOTgzNzgwODI1MjQxOSIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       source: "Uniqlo",
    //       source_icon:
    //         "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/6410f1fdac3761c04da6e77077f496f4ec8f18355d226ede1f8bedaf149b5678.png",
    //       price: "$39.90",
    //       extracted_price: 39.9,
    //       old_price: "Was $50",
    //       extracted_old_price: 50,
    //       rating: null,
    //       thumbnail:
    //         "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTemh6JqX6ktSU8XIQ7_WCAIlipFT2qQ6OLP1XnGm6IEzK3EUhWIcEldjMRj5GWsF7dAq0kx-TI_IGcQe-Iw8pbEd5myRW7JSOJ_JlRMuCiCFzEFq20WDtQPXNW",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/s1-xIXicDclJDoIwAADAF7GIYZHEGIKFFGUVUm5EWsIOrdQoPMvf-Bud63w_Ded0MSWpmvBjpbwiAi8nRawXfuctFvE8SkszU9pO9Ykd_2daATm4OK3GRvNYrvX8lhk5jPUC2RYcWuqkCou18Brt8skdNQi2yx5kDYIYDKTzk0510eLoxGJy_xZSWEAXx5UAXwYtAVHHNUG6dwu9whsS_2m3trMBhykyOvM4ygP0A9XJPfw",
    //       tag: "20% OFF",
    //       extensions: ["20% OFF"],
    //       delivery: "Free delivery on $99+",
    //     },
    //     {
    //       position: 17,
    //       title: "UNIQLO Women's Satin Easy Pants",
    //       product_id: "7079912517067151388",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=7079912517067151388",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:7079912517067151388,headlineOfferDocid:12977499989543580845,imageDocid:6523929497202838956,gpcid:5699328563839782106,mid:576462861457687463,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiNzA3OTkxMjUxNzA2NzE1MTM4OCIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjEyOTc3NDk5OTg5NTQzNTgwODQ1IiwiaW1hZ2VEb2NpZCI6IjY1MjM5Mjk0OTcyMDI4Mzg5NTYiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI1Njk5MzI4NTYzODM5NzgyMTA2IiwibWlkIjoiNTc2NDYyODYxNDU3Njg3NDYzIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiNzA3OTkxMjUxNzA2NzE1MTM4OCIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjEyOTc3NDk5OTg5NTQzNTgwODQ1IiwiaW1hZ2VEb2NpZCI6IjY1MjM5Mjk0OTcyMDI4Mzg5NTYiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI1Njk5MzI4NTYzODM5NzgyMTA2IiwibWlkIjoiNTc2NDYyODYxNDU3Njg3NDYzIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //       source: "Uniqlo",
    //       source_icon:
    //         "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/6410f1fdac3761c04da6e77077f496f473f1827a511e2d11366ee5964e05aeb1.png",
    //       price: "$19.90",
    //       extracted_price: 19.9,
    //       old_price: "Was $30",
    //       extracted_old_price: 30,
    //       rating: null,
    //       thumbnail:
    //         "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQ0SiK1rXnWZ1y9BScKYVx2qBKYls12emKu6UDvpaDMZLZdh_-mQG1L7QcVs-idjo3_2aAfTTNOshcsp8ZWb5J3qH4tP2Gtc_B2PsBA_KnXhhuYOV9UDDavIsw",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/yYMp03icDclJDoIwFADQEyFQR0iMgZCgFhkiMm0IFLQYKYVfVI7lcbyNvu37fqgQHHRZrhkZJi7qShIlU2Y3EIVoyIx0rQy047xht12__Z9uuJVmk0A5N1gdEhZn6qSZZ4LT6I16E6cPUFHd4nF1sZ68sE6Zk1U0l9rAVp11QCKQmurezXNUGNcwdD2gBPgmi8vlcd7vF8JHtiC5iXwwjRyzhNIx9SLtYlnF8wCvH7WbPpc",
    //       tag: "33% OFF",
    //       extensions: ["33% OFF"],
    //       delivery: "Free delivery on $99+",
    //     },
    //     {
    //       position: 18,
    //       title: "UNIQLO Women's Smart Flare Pants",
    //       product_id: "3290924458123520071",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=3290924458123520071",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:3290924458123520071,headlineOfferDocid:7506004878669578824,imageDocid:7195699419431107332,rds:PC_4967081093752963824|PROD_PC_4967081093752963824,gpcid:4967081093752963824,mid:576462826630181789,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMzI5MDkyNDQ1ODEyMzUyMDA3MSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6Ijc1MDYwMDQ4Nzg2Njk1Nzg4MjQiLCJpbWFnZURvY2lkIjoiNzE5NTY5OTQxOTQzMTEwNzMzMiIsInJkcyI6IlBDXzQ5NjcwODEwOTM3NTI5NjM4MjR8UFJPRF9QQ180OTY3MDgxMDkzNzUyOTYzODI0IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiNDk2NzA4MTA5Mzc1Mjk2MzgyNCIsIm1pZCI6IjU3NjQ2MjgyNjYzMDE4MTc4OSIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMzI5MDkyNDQ1ODEyMzUyMDA3MSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6Ijc1MDYwMDQ4Nzg2Njk1Nzg4MjQiLCJpbWFnZURvY2lkIjoiNzE5NTY5OTQxOTQzMTEwNzMzMiIsInJkcyI6IlBDXzQ5NjcwODEwOTM3NTI5NjM4MjR8UFJPRF9QQ180OTY3MDgxMDkzNzUyOTYzODI0IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiNDk2NzA4MTA5Mzc1Mjk2MzgyNCIsIm1pZCI6IjU3NjQ2MjgyNjYzMDE4MTc4OSIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       source: "Uniqlo",
    //       source_icon:
    //         "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/6410f1fdac3761c04da6e77077f496f4f8349179e2d4f23fcb75b960f8bab752.png",
    //       multiple_sources: true,
    //       price: "$19.90",
    //       extracted_price: 19.9,
    //       old_price: "Was $40",
    //       extracted_old_price: 40,
    //       rating: 5,
    //       reviews: 1,
    //       thumbnail:
    //         "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSLOZKRRdTD5HSKrcu5USo5WAAakq2OIEHKEO7hrusj8uvjDY2MNO6wP2QIu_l5ieb1akSTygboOZNgMXxoNXqyLWvHGJgMBLNR-FceeiVl8rKfKkpFXyXLci4",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/lOr_OHicDcn_EkIwAADgJyrl0q-7rtNJamyFSv7pmDVDNozyWD1Ob1Pfv9_3k0opmqWikBLXvZAkGci4HA1pIyPJ8BDzp9KkXAhW0nW1-t9Sh8lihz0bhcB1E9_QLA_UuNXOHteuuh7llYr2Wwts0Syt2yabt11m3FQHounrqJ727b3QGInHUe75PY05CiF1gjeHQdXb187aHaizsaE7MDEh7FLMa_AAuTCDPrAxm_wAy2E_TQ",
    //       tag: "50% OFF",
    //       extensions: ["50% OFF"],
    //       delivery: "Free delivery on $99+",
    //     },
    //     {
    //       position: 19,
    //       title: "UNIQLO Women's Flare Pants",
    //       product_id: "3043918147559448679",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=3043918147559448679",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:3043918147559448679,headlineOfferDocid:9335467865353435051,imageDocid:15143612369932815058,gpcid:5750836976733845859,mid:576462863782610372,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMzA0MzkxODE0NzU1OTQ0ODY3OSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjkzMzU0Njc4NjUzNTM0MzUwNTEiLCJpbWFnZURvY2lkIjoiMTUxNDM2MTIzNjk5MzI4MTUwNTgiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI1NzUwODM2OTc2NzMzODQ1ODU5IiwibWlkIjoiNTc2NDYyODYzNzgyNjEwMzcyIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMzA0MzkxODE0NzU1OTQ0ODY3OSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjkzMzU0Njc4NjUzNTM0MzUwNTEiLCJpbWFnZURvY2lkIjoiMTUxNDM2MTIzNjk5MzI4MTUwNTgiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI1NzUwODM2OTc2NzMzODQ1ODU5IiwibWlkIjoiNTc2NDYyODYzNzgyNjEwMzcyIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //       source: "Uniqlo",
    //       source_icon:
    //         "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/6410f1fdac3761c04da6e77077f496f40986291f5056e483566678fdde53bbf3.png",
    //       multiple_sources: true,
    //       price: "$39.90",
    //       extracted_price: 39.9,
    //       old_price: "Was $60",
    //       extracted_old_price: 60,
    //       rating: null,
    //       thumbnail:
    //         "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTSxxpSfp7WTv0VZgn9B3Y7CZJbE4EE12NlgZwiMIS5Htm8wy4sSwkuQgwo1-tOtKesK-cHSzXNzPCTrEA1enZxBEU7tWajGtCFqUU3NmWT0Hx1mQKoMZQLUQ",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/AJlFpXicDcndEoFAGADQJ0rlZ1IzxlSzRIpmS-xdbVmhbdmP0lN5HW_DuT3fzxlASEtVS04fbwFloUDOhwMmIYOKDmhTq_LcCFFxNr_P_mfZYWEuaYy7TuCTMNL4pe0J46YzOhouWedojJA-DG-MtFWwwhMP6mn7HkvcXp8RaxtdgS34pfQV6uH-EPY7N34gWy856RyUGJBmlyW4i3uSjMI6jTWv0-vIbwISbZLoB65BPqw",
    //       tag: "33% OFF",
    //       extensions: ["33% OFF"],
    //       delivery: "Free delivery on $99+",
    //     },
    //     {
    //       position: 20,
    //       title: "Gap Men's Ultrasoft Pleated Trousers",
    //       product_id: "6634309362900687063",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=6634309362900687063",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:6634309362900687063,headlineOfferDocid:6076778128788062161,imageDocid:12081069887449519187,rds:PC_4115662465221683346|PROD_PC_4115662465221683346,gpcid:4115662465221683346,mid:576462510732931234,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiNjYzNDMwOTM2MjkwMDY4NzA2MyIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjYwNzY3NzgxMjg3ODgwNjIxNjEiLCJpbWFnZURvY2lkIjoiMTIwODEwNjk4ODc0NDk1MTkxODciLCJyZHMiOiJQQ180MTE1NjYyNDY1MjIxNjgzMzQ2fFBST0RfUENfNDExNTY2MjQ2NTIyMTY4MzM0NiIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IjQxMTU2NjI0NjUyMjE2ODMzNDYiLCJtaWQiOiI1NzY0NjI1MTA3MzI5MzEyMzQiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ==",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiNjYzNDMwOTM2MjkwMDY4NzA2MyIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjYwNzY3NzgxMjg3ODgwNjIxNjEiLCJpbWFnZURvY2lkIjoiMTIwODEwNjk4ODc0NDk1MTkxODciLCJyZHMiOiJQQ180MTE1NjYyNDY1MjIxNjgzMzQ2fFBST0RfUENfNDExNTY2MjQ2NTIyMTY4MzM0NiIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IjQxMTU2NjI0NjUyMjE2ODMzNDYiLCJtaWQiOiI1NzY0NjI1MTA3MzI5MzEyMzQiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ%3D%3D",
    //       source: "Gap",
    //       source_icon:
    //         "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/6410f1fdac3761c04da6e77077f496f44f4871f00b068934d0be3b76919e76a5.png",
    //       multiple_sources: true,
    //       price: "$54.99",
    //       extracted_price: 54.99,
    //       old_price: "$80",
    //       extracted_old_price: 80,
    //       rating: 4.3,
    //       reviews: 64,
    //       thumbnail:
    //         "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQwjiv_ccMHs4wFhGAINOI2mV8cLOTg0G-ek5l4swyoN0y9AZpke9GUcwFOfbCwL0ucPL34SQU1rjPX5afatkkoSQNrSzTmLyP1J2fnv0mh8G1x0ir6V_e9nA",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/9O7lDnicDcndCoIwGADQJ1JnamgQIUHLMH8wI7oR-5y_OZdbLnuqXqe3qXN7vp9aCMZXmkYojDMTpFDEjRpqxUUuGlBh6DVeD4w1tNo81v9buUHhYIhl20wZwHHPTbmrsesFobfozzb44alCWCGddTe5nIcAzY57ZR1xcApyF5a3rfTREyLfMJM41cc2ulh5mYuuG5I4GJP3qffnSD8sSjqhvrax_kLNuDxnxKHuD7YEPtI",
    //       tag: "31% OFF",
    //       extensions: ["31% OFF"],
    //     },
    //     {
    //       position: 21,
    //       title: "UNIQLO Women's Nylon Culottes",
    //       product_id: "15161509554481424750",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=15161509554481424750",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:15161509554481424750,headlineOfferDocid:18264804638257081511,imageDocid:2940785046594620740,rds:PC_7421758706503930497|PROD_PC_7421758706503930497,gpcid:7421758706503930497,mid:576462839717966383,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTUxNjE1MDk1NTQ0ODE0MjQ3NTAiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxODI2NDgwNDYzODI1NzA4MTUxMSIsImltYWdlRG9jaWQiOiIyOTQwNzg1MDQ2NTk0NjIwNzQwIiwicmRzIjoiUENfNzQyMTc1ODcwNjUwMzkzMDQ5N3xQUk9EX1BDXzc0MjE3NTg3MDY1MDM5MzA0OTciLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI3NDIxNzU4NzA2NTAzOTMwNDk3IiwibWlkIjoiNTc2NDYyODM5NzE3OTY2MzgzIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTUxNjE1MDk1NTQ0ODE0MjQ3NTAiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxODI2NDgwNDYzODI1NzA4MTUxMSIsImltYWdlRG9jaWQiOiIyOTQwNzg1MDQ2NTk0NjIwNzQwIiwicmRzIjoiUENfNzQyMTc1ODcwNjUwMzkzMDQ5N3xQUk9EX1BDXzc0MjE3NTg3MDY1MDM5MzA0OTciLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI3NDIxNzU4NzA2NTAzOTMwNDk3IiwibWlkIjoiNTc2NDYyODM5NzE3OTY2MzgzIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //       source: "Uniqlo",
    //       source_icon:
    //         "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcSIeGkqa_kLTVTNyArc66HNnsOSdtKhl2aZWkdvbZK2dNO3aDtdhgnkxYbvak3yBel2AkvRjLIqaeuToJkkih0J8TbSZ7HA3w",
    //       price: "$49.90",
    //       extracted_price: 49.9,
    //       rating: 5,
    //       reviews: 1,
    //       thumbnail:
    //         "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRMejncNqHntSgxzPqgYjlT3peaPHGoX7qVczk9sMCdIf_l3DoHr6aUnlrkxLw-RxEGTkBIc-9fMY-0b86pPX0ImEaxTOpotAdRA1luvl6A5t6vVobZAojZiQ",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/tKIIEHicDclvD0JAHADgT-RPs67YWrvKsEWSGt40joRzd_gl9an6On2bet4-388dQAyGohSM9C8BRS5BxlS5HCCFisiEt8pw50JUrFx3q_8Z2Mt1iwRuUTPidTaDUzm9_a6Maxpqokh92-LRoruQd6MP7jZ3bleq7bjdo_TMaN9M-6cUTKYVNhuHSPrNjSU1WyLhR6rTmukUHgQHnAd4Rh8jRXgOaLzwLMG8TqrjDynrQBo",
    //       delivery: "Free delivery on $99+",
    //     },
    //     {
    //       position: 22,
    //       title: "Cotton On Men's Relaxed Pleated Pant",
    //       product_id: "1691451841769684225",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=1691451841769684225",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:1691451841769684225,headlineOfferDocid:14781280530263045232,imageDocid:4164218799963781190,rds:PC_10864118335806978746|PROD_PC_10864118335806978746,gpcid:10864118335806978746,mid:576462797026524096,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTY5MTQ1MTg0MTc2OTY4NDIyNSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjE0NzgxMjgwNTMwMjYzMDQ1MjMyIiwiaW1hZ2VEb2NpZCI6IjQxNjQyMTg3OTk5NjM3ODExOTAiLCJyZHMiOiJQQ18xMDg2NDExODMzNTgwNjk3ODc0NnxQUk9EX1BDXzEwODY0MTE4MzM1ODA2OTc4NzQ2IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiMTA4NjQxMTgzMzU4MDY5Nzg3NDYiLCJtaWQiOiI1NzY0NjI3OTcwMjY1MjQwOTYiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ==",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTY5MTQ1MTg0MTc2OTY4NDIyNSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjE0NzgxMjgwNTMwMjYzMDQ1MjMyIiwiaW1hZ2VEb2NpZCI6IjQxNjQyMTg3OTk5NjM3ODExOTAiLCJyZHMiOiJQQ18xMDg2NDExODMzNTgwNjk3ODc0NnxQUk9EX1BDXzEwODY0MTE4MzM1ODA2OTc4NzQ2IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiMTA4NjQxMTgzMzU4MDY5Nzg3NDYiLCJtaWQiOiI1NzY0NjI3OTcwMjY1MjQwOTYiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ%3D%3D",
    //       source: "Cotton On",
    //       source_icon:
    //         "https://encrypted-tbn1.gstatic.com/favicon-tbn?q=tbn%3AANd9GcTKZZ1E-rOYK0_ParJ-gYjNN_u0-Rj2JvVhChl8UCe4Gs6aotHw5PFpImNnjqZORA5XvDN9gTEEzM3ej5ahrTA61H7PXCtKysBL",
    //       multiple_sources: true,
    //       price: "$10.00",
    //       extracted_price: 10,
    //       old_price: "$15",
    //       extracted_old_price: 15,
    //       rating: 4.9,
    //       reviews: 15,
    //       thumbnail:
    //         "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcQfp1Nm9OMY3N_0IdHk-GQBE92eKIvlE_hH1LBK5E2p0pDtyygfJ4DNo48ARI4QndGqHl4ijxItniWAyQrIMZgLghPPqsD8b8S9VKEnKhIG8klGMqybJbqlox8",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/gxUHDXicDcnbCoIwAADQL_KawRQiFGXOW1pQ1IvkbTN1bjrCfVaf09_UeT3fDxGCrY6mtbReJBNto4iKmipexVP0tVrPk7aSmbGe4iM__M9xs8aGddExI5vsU3rfZaWOmnBQYOEFttnG6D0GJQmNxIv3gcl05gspcRdZfjZbwD0jq6AN5OFo9a8NCdrfXFksKH3gBJM856sPKnCxr3FAY4IgGEaYcllFFR_nDfwAZrM-NA",
    //       tag: "33% OFF",
    //       extensions: ["33% OFF"],
    //       delivery: "Free delivery on $70+",
    //     },
    //     {
    //       position: 23,
    //       title: "Zara Men's Relaxed Fit Pleated Pants",
    //       product_id: "3880545978586825371",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=3880545978586825371",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:3880545978586825371,headlineOfferDocid:10277876821213863612,imageDocid:1295919183356451403,gpcid:17162594035482329064,mid:576462839980488474,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMzg4MDU0NTk3ODU4NjgyNTM3MSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjEwMjc3ODc2ODIxMjEzODYzNjEyIiwiaW1hZ2VEb2NpZCI6IjEyOTU5MTkxODMzNTY0NTE0MDMiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIxNzE2MjU5NDAzNTQ4MjMyOTA2NCIsIm1pZCI6IjU3NjQ2MjgzOTk4MDQ4ODQ3NCIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMzg4MDU0NTk3ODU4NjgyNTM3MSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjEwMjc3ODc2ODIxMjEzODYzNjEyIiwiaW1hZ2VEb2NpZCI6IjEyOTU5MTkxODMzNTY0NTE0MDMiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIxNzE2MjU5NDAzNTQ4MjMyOTA2NCIsIm1pZCI6IjU3NjQ2MjgzOTk4MDQ4ODQ3NCIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       source: "Zara USA",
    //       source_icon:
    //         "https://encrypted-tbn1.gstatic.com/favicon-tbn?q=tbn%3AANd9GcSN0khTgyojqfj_ZqNbM8fDglE4cUYLRi0GfH-sanXaLAkwPl_swXz0__69HliBabFTVq-qZx8EAcn1SV-42kSaa1vVj24",
    //       price: "$79.90",
    //       extracted_price: 79.9,
    //       rating: null,
    //       thumbnail:
    //         "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcRc5uV17n_iZywK93sWO9SAuIF1JUcpvp1WMo-MLE2kGKucNW7xvHtT4UrcpEjBZeYTsHdquE0y84P_jK_eugH5dbE8J3r8gajc3buCWQ_8eT4FtaIj4qxwGGk",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/Ft-PQXicDclLDoIwFADAEwliIRYTY9Tw9y_YyIbAo0EwQqGtwLE8jrfR2c738xCC8YWq0hq6kQmaT0RWI6XgIhUlKNC8VP5oGCvrYtUu_7dYH3LTgQsY8qbN66SMxz4wESdH87qWnq35EbA308i-mex31uzpBBIOZD68XRHqUQfMqjYxvYfczVtpTUesn5IqSKgsXCPPLOyjDhdpBSiTW3JOMA11W6RepbdD7zjPH9NwPv8",
    //     },
    //     {
    //       position: 24,
    //       title: "AE77 Premium Pleated Trouser Pants",
    //       product_id: "15231962106650584788",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=15231962106650584788",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:15231962106650584788,headlineOfferDocid:14504012508662467999,imageDocid:14479049644267732507,rds:PC_3148690230936266422|PROD_PC_3148690230936266422,gpcid:3148690230936266422,mid:576462820341385073,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTUyMzE5NjIxMDY2NTA1ODQ3ODgiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNDUwNDAxMjUwODY2MjQ2Nzk5OSIsImltYWdlRG9jaWQiOiIxNDQ3OTA0OTY0NDI2NzczMjUwNyIsInJkcyI6IlBDXzMxNDg2OTAyMzA5MzYyNjY0MjJ8UFJPRF9QQ18zMTQ4NjkwMjMwOTM2MjY2NDIyIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiMzE0ODY5MDIzMDkzNjI2NjQyMiIsIm1pZCI6IjU3NjQ2MjgyMDM0MTM4NTA3MyIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTUyMzE5NjIxMDY2NTA1ODQ3ODgiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNDUwNDAxMjUwODY2MjQ2Nzk5OSIsImltYWdlRG9jaWQiOiIxNDQ3OTA0OTY0NDI2NzczMjUwNyIsInJkcyI6IlBDXzMxNDg2OTAyMzA5MzYyNjY0MjJ8UFJPRF9QQ18zMTQ4NjkwMjMwOTM2MjY2NDIyIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiMzE0ODY5MDIzMDkzNjI2NjQyMiIsIm1pZCI6IjU3NjQ2MjgyMDM0MTM4NTA3MyIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       source: "American Eagle Outfitters",
    //       source_icon:
    //         "https://encrypted-tbn0.gstatic.com/favicon-tbn?q=tbn%3AANd9GcRFboVazoRVL1tg7aoTWCGv2P_SWxnlwS08TD-ztXOLT2bnfkhHV9P4z7BK0Kzq4gEoG2DrliNOYNFw27MRKfJD7fhc",
    //       price: "$41.40",
    //       extracted_price: 41.4,
    //       old_price: "$138",
    //       extracted_old_price: 138,
    //       rating: 3.8,
    //       reviews: 28,
    //       thumbnail:
    //         "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcRopsK4N9LP34fOsemmVGRhojTbfF750Y6qIulyOb6G25Ri5K1qbMKrb4Cimbe2begupyYfuPuY03pe6HcaV9MxrugFoUkQ4ZN_gGHutzmurfIBH7wjYuctLg",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/g9_sonicDcnbCoIwAADQL0rNKwoRFXjBW0kJ9hJuzqk1N91G2Vf1O_1Nndfz_XRCMO6pKhrhvDCBmpUAo6FgLmrRQwVSovKOMtaPeDtt_uftssYNYEEZj83MTY6G2eYcEVIGRUeHM2h9x9Iqe4rkY8mBHehW0VvxegJpPAPz0BOAdICwZEvVyqOsNIMhO4R16aavWWKfXu4n85rdcBBK8SZybqN96DyHSkKR4B-yMz_l",
    //       tag: "70% OFF",
    //       extensions: ["70% OFF"],
    //     },
    //     {
    //       position: 25,
    //       title: "UNIQLO Women's Barrel Pants",
    //       product_id: "5504122553635469898",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=5504122553635469898",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:5504122553635469898,headlineOfferDocid:4482008385200409916,imageDocid:12325496305164687299,gpcid:8297049249099220059,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiNTUwNDEyMjU1MzYzNTQ2OTg5OCIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjQ0ODIwMDgzODUyMDA0MDk5MTYiLCJpbWFnZURvY2lkIjoiMTIzMjU0OTYzMDUxNjQ2ODcyOTkiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI4Mjk3MDQ5MjQ5MDk5MjIwMDU5IiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiNTUwNDEyMjU1MzYzNTQ2OTg5OCIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjQ0ODIwMDgzODUyMDA0MDk5MTYiLCJpbWFnZURvY2lkIjoiMTIzMjU0OTYzMDUxNjQ2ODcyOTkiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI4Mjk3MDQ5MjQ5MDk5MjIwMDU5IiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //       source: "Uniqlo",
    //       source_icon:
    //         "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcSIeGkqa_kLTVTNyArc66HNnsOSdtKhl2aZWkdvbZK2dNO3aDtdhgnkxYbvak3yBel2AkvRjLIqaeuToJkkih0J8TbSZ7HA3w",
    //       price: "$49.90",
    //       extracted_price: 49.9,
    //       rating: null,
    //       thumbnail:
    //         "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQsL9yxyXutSNcBvcU3MAYGHnR8ucec5L2zHCOzHSduVyN8EiDaOlV_EO-1426f1ZnOX7NH-EohOew0WvpiWaFaIHbOY7kVWeJieTXJMxHvKxDPWiXS9iBk",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/hhdNgHicDcnbEoFAAADQL6oQuswYU4pFtYguXkxtq3ZiW9pSPsr_-BvO6_l-Cs5ZrUsSpujZM44zgadUFvOaJ5wgEVV3qS4qxgjN54_Z_3TDy7QV2teO1nd91HDfQ2aLTrJrxCtAD2qDMJo4ozdYwDfwsyboPdUmVgJvwcWGwnA8ml6HZwojxQOCXRUQvwZhy0iYLJM1SGGslEGINwQfo43bgXbbWbuQRL5GzPIHKfw92A",
    //       delivery: "Free delivery on $99+",
    //     },
    //     {
    //       position: 26,
    //       title: "UNIQLO Women's Cotton Barrel Ankle Pants",
    //       product_id: "1542087579546095625",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=1542087579546095625",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:1542087579546095625,headlineOfferDocid:8703762576106180694,imageDocid:9274050732646114847,rds:PC_419334914789917666|PROD_PC_419334914789917666,gpcid:419334914789917666,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTU0MjA4NzU3OTU0NjA5NTYyNSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6Ijg3MDM3NjI1NzYxMDYxODA2OTQiLCJpbWFnZURvY2lkIjoiOTI3NDA1MDczMjY0NjExNDg0NyIsInJkcyI6IlBDXzQxOTMzNDkxNDc4OTkxNzY2NnxQUk9EX1BDXzQxOTMzNDkxNDc4OTkxNzY2NiIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IjQxOTMzNDkxNDc4OTkxNzY2NiIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTU0MjA4NzU3OTU0NjA5NTYyNSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6Ijg3MDM3NjI1NzYxMDYxODA2OTQiLCJpbWFnZURvY2lkIjoiOTI3NDA1MDczMjY0NjExNDg0NyIsInJkcyI6IlBDXzQxOTMzNDkxNDc4OTkxNzY2NnxQUk9EX1BDXzQxOTMzNDkxNDc4OTkxNzY2NiIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IjQxOTMzNDkxNDc4OTkxNzY2NiIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       source: "Uniqlo",
    //       source_icon:
    //         "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcSIeGkqa_kLTVTNyArc66HNnsOSdtKhl2aZWkdvbZK2dNO3aDtdhgnkxYbvak3yBel2AkvRjLIqaeuToJkkih0J8TbSZ7HA3w",
    //       price: "$59.90",
    //       extracted_price: 59.9,
    //       rating: 5,
    //       reviews: 1,
    //       thumbnail:
    //         "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcROxaFFfMp79-TE3SF3keCGuo-I67B-9WYDruS6W2ewd36kuqmS5zhaSOkGdW3WYG1EvoQdthJUoSoNZElCIdv-gnZHqdJzTxxpNstyCYudAFL6FdQvUCcAp0s4",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/5dbbZnicDcnxDoFAHADgJzrhyLKZJV00slztlv9yv5RFd3VXymN5G2_D9-_3_RRaS7U0jKzizSB1BkhfKzzKlU71nY-4eBqqEFLeq3xdr_63tAOwPH4-9Skht6NcWChyMSW4zByvFWhvLjbIYsm2aanJptkLsFm29ZPO30VKT6UHDLPEm7idCEEXfiyoCC7uw9lDh_LqsqvBf0d9LwOlBydpwSYHk0DYxQ635VjNftibPzY",
    //       delivery: "Free delivery on $99+",
    //     },
    //     {
    //       position: 27,
    //       title: "UNIQLO Cargo Pants",
    //       product_id: "5521922147397300062",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=5521922147397300062",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:5521922147397300062,headlineOfferDocid:950610217329591220,imageDocid:8588983143109233755,gpcid:6593977202801032808,mid:576462839979554087,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiNTUyMTkyMjE0NzM5NzMwMDA2MiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6Ijk1MDYxMDIxNzMyOTU5MTIyMCIsImltYWdlRG9jaWQiOiI4NTg4OTgzMTQzMTA5MjMzNzU1IiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiNjU5Mzk3NzIwMjgwMTAzMjgwOCIsIm1pZCI6IjU3NjQ2MjgzOTk3OTU1NDA4NyIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiNTUyMTkyMjE0NzM5NzMwMDA2MiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6Ijk1MDYxMDIxNzMyOTU5MTIyMCIsImltYWdlRG9jaWQiOiI4NTg4OTgzMTQzMTA5MjMzNzU1IiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiNjU5Mzk3NzIwMjgwMTAzMjgwOCIsIm1pZCI6IjU3NjQ2MjgzOTk3OTU1NDA4NyIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       source: "Uniqlo",
    //       source_icon:
    //         "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcSIeGkqa_kLTVTNyArc66HNnsOSdtKhl2aZWkdvbZK2dNO3aDtdhgnkxYbvak3yBel2AkvRjLIqaeuToJkkih0J8TbSZ7HA3w",
    //       multiple_sources: true,
    //       price: "$59.90",
    //       extracted_price: 59.9,
    //       rating: null,
    //       thumbnail:
    //         "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcSIoWnu16vU6e1K9wuBBiWPM8zRQzv8_5L-HE7Iym5kIZSFPA1WPh9F5FhgF9ih5tAH4EimTdDfQUatHihP9dTNhMJdZM6NrwUgLnw2R7LbBSfRqN5OebwH_A",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/cItVknicDcnbDkMwAADQLxqxrahkWcgYG-YaiRdB0WZRtyJ81X5nf7Od1_P9YMb6SeH5ipbj1rMKHVhBT1wzsZyRkiu7lp9w1_eENtfh8j9FdRG8l6HVJXQWxCUWK-EJ11nTSOI58h74-yJnwD6YumRtLXhbaWh4qpB4GBrAwI0BCQZMNc86aSN0q_04ZybBHkSRi50HSh3RHde4sel6DCS70MI6GFzwqorVzNQfSwY9iQ",
    //       delivery: "Free delivery on $99+",
    //     },
    //     {
    //       position: 28,
    //       title: "UNIQLO Women's Flannel Checked Pants",
    //       product_id: "3249610262723838537",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=3249610262723838537",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:3249610262723838537,headlineOfferDocid:5541188615565560717,imageDocid:5012389339211422348,gpcid:6726300270214432744,mid:576462847622395938,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMzI0OTYxMDI2MjcyMzgzODUzNyIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjU1NDExODg2MTU1NjU1NjA3MTciLCJpbWFnZURvY2lkIjoiNTAxMjM4OTMzOTIxMTQyMjM0OCIsInJkcyI6IiIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IjY3MjYzMDAyNzAyMTQ0MzI3NDQiLCJtaWQiOiI1NzY0NjI4NDc2MjIzOTU5MzgiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ==",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMzI0OTYxMDI2MjcyMzgzODUzNyIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjU1NDExODg2MTU1NjU1NjA3MTciLCJpbWFnZURvY2lkIjoiNTAxMjM4OTMzOTIxMTQyMjM0OCIsInJkcyI6IiIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IjY3MjYzMDAyNzAyMTQ0MzI3NDQiLCJtaWQiOiI1NzY0NjI4NDc2MjIzOTU5MzgiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ%3D%3D",
    //       source: "Uniqlo",
    //       source_icon:
    //         "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcSIeGkqa_kLTVTNyArc66HNnsOSdtKhl2aZWkdvbZK2dNO3aDtdhgnkxYbvak3yBel2AkvRjLIqaeuToJkkih0J8TbSZ7HA3w",
    //       price: "$39.90",
    //       extracted_price: 39.9,
    //       rating: null,
    //       thumbnail:
    //         "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQwAC-XFG4JEukOMMYAvs-2H2TeAihh9_9QbnKUifrqhlSXjBgyXnkCJRiEj7W1EPehiKBNkySUs6xaUisOtKXEKuukc21X-Q6GyzjyF05o_9U1tmP10ZYpxkiQ",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/L713InicDcltDoIgAADQE-HXyqZba-bMptMyc2F_XJEJkkiBJR2r23Sben_f94Ol5MLV9Zqhh-KyvgB5ZobWCHmSBGmo73SBe84Jaxb3-f9cL704Icpeng_gKpxEwUA3SVJ6TwGstbWvPYKxUznZmcUFuT7u-JbDdtkoyKgf7UjQzg5msK0xiZcpVXkh7PFUELGRMQziYaDIMiHI7FC9W7Uypn3lFKbstqZxLPlISfYDD1U_gA",
    //       delivery: "Free delivery on $99+",
    //     },
    //     {
    //       position: 29,
    //       title: "Gap Men's 365 Ponte Pleated Trousers",
    //       product_id: "3020419020339576595",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=3020419020339576595",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:3020419020339576595,headlineOfferDocid:9231469022647098468,imageDocid:9444476086112984973,rds:PC_6728116923952752307|PROD_PC_6728116923952752307,gpcid:6728116923952752307,mid:576462820341346473,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMzAyMDQxOTAyMDMzOTU3NjU5NSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjkyMzE0NjkwMjI2NDcwOTg0NjgiLCJpbWFnZURvY2lkIjoiOTQ0NDQ3NjA4NjExMjk4NDk3MyIsInJkcyI6IlBDXzY3MjgxMTY5MjM5NTI3NTIzMDd8UFJPRF9QQ182NzI4MTE2OTIzOTUyNzUyMzA3IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiNjcyODExNjkyMzk1Mjc1MjMwNyIsIm1pZCI6IjU3NjQ2MjgyMDM0MTM0NjQ3MyIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMzAyMDQxOTAyMDMzOTU3NjU5NSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjkyMzE0NjkwMjI2NDcwOTg0NjgiLCJpbWFnZURvY2lkIjoiOTQ0NDQ3NjA4NjExMjk4NDk3MyIsInJkcyI6IlBDXzY3MjgxMTY5MjM5NTI3NTIzMDd8UFJPRF9QQ182NzI4MTE2OTIzOTUyNzUyMzA3IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiNjcyODExNjkyMzk1Mjc1MjMwNyIsIm1pZCI6IjU3NjQ2MjgyMDM0MTM0NjQ3MyIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       source: "Gap",
    //       source_icon:
    //         "https://encrypted-tbn2.gstatic.com/favicon-tbn?q=tbn%3AANd9GcSLiMaYv-EDtQhWNUs9sQqk96Vc07N6r-kH8RRJAP4rNr442I1p0wQ-tADTBdRWvuC1dNtTf0NN225pxsQWv9r-mepm",
    //       price: "$44.99",
    //       extracted_price: 44.99,
    //       old_price: "$90",
    //       extracted_old_price: 90,
    //       rating: 4.8,
    //       reviews: 76,
    //       thumbnail:
    //         "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcSrzI__KSG800cn9kJXbwPP_BrIrwCif_E_JFuNvmnFm2wwdVMET8kx-QrkzhGJTvWo0roXUs2EPvdbHJW3EgBZHVCM_1ptjU1o7QCp6pjpqBxgZWSKYn0jnN4-",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/5bfcYXicDcltDoIgAADQE5larbSttXRm6nI2Nas_LKHwYwIBiXmsbtNt6v19308lJRMrXb8TyN9M3pEmS2JOsJA3WcMJpJ0uKspYTfDmuf7fahsj24cpHwMAotS3DAMSuw3PpUoS4PCAK7d-AA-Eu1fcd2TXTZVCp4OXWe2gHXk7Vn6Y9QU1OD3nYuolPSr3YTHzsHPdn9wDMJlscpMujy5bsIY9nQFfizS6EKMh8Vz7AWdWQBk",
    //       tag: "49% OFF",
    //       extensions: ["49% OFF"],
    //     },
    //     {
    //       position: 30,
    //       title: "UNIQLO Women's Flannel Pants",
    //       product_id: "1173220891128950089",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=1173220891128950089",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:1173220891128950089,headlineOfferDocid:14815654823826440278,imageDocid:17139229710399572497,gpcid:14181057688599130549,mid:576462863784789624,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTE3MzIyMDg5MTEyODk1MDA4OSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjE0ODE1NjU0ODIzODI2NDQwMjc4IiwiaW1hZ2VEb2NpZCI6IjE3MTM5MjI5NzEwMzk5NTcyNDk3IiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiMTQxODEwNTc2ODg1OTkxMzA1NDkiLCJtaWQiOiI1NzY0NjI4NjM3ODQ3ODk2MjQiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ==",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTE3MzIyMDg5MTEyODk1MDA4OSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjE0ODE1NjU0ODIzODI2NDQwMjc4IiwiaW1hZ2VEb2NpZCI6IjE3MTM5MjI5NzEwMzk5NTcyNDk3IiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiMTQxODEwNTc2ODg1OTkxMzA1NDkiLCJtaWQiOiI1NzY0NjI4NjM3ODQ3ODk2MjQiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ%3D%3D",
    //       source: "Uniqlo",
    //       source_icon:
    //         "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcSIeGkqa_kLTVTNyArc66HNnsOSdtKhl2aZWkdvbZK2dNO3aDtdhgnkxYbvak3yBel2AkvRjLIqaeuToJkkih0J8TbSZ7HA3w",
    //       price: "$39.90",
    //       extracted_price: 39.9,
    //       rating: null,
    //       thumbnail:
    //         "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTbsf45AmuhE5Q_GD00WH51OErN3X_MWmGQPSd5RE58QFx5ME-mqolmnyrNkrrtzyLIagmg-Ylp7bLl6NWlXjsqKqo32-kp9bFIStaUGL8EWzPoZXUVIoae_g",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/bKq8QXicDcltDoIgAADQE6GZUerWmltkLjXNTOuP8yusRBBoy07VdbpNvb_v-2mlZMJS1aav-MhkUwNZ9pqChSzkrVIqSlTRUsZuPV4Ny_9ZdlCbTnUsxXUGbfJsEYxyZz2ZpFuo7REP9Cz3U-JEYVzDA4JGtHlBHwEy0I70Iw8enMv36LkFJhicO7YovW4epF12F8NuoPoUPJhZbtxYFonjGSh9h_SSJSeXFk2Of2u8PsI",
    //       delivery: "Free delivery on $99+",
    //     },
    //     {
    //       position: 31,
    //       title: "Uniqlo Pleated Wide Leg Baggy Khaki Dress",
    //       product_id: "6737344302087545734",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=6737344302087545734",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=productid:6737344302087545734,headlineOfferDocid:6737344302087545734,imageDocid:7758458699223895441,rds:PC_3183198369991433542|PROD_PC_3183198369991433542,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiNjczNzM0NDMwMjA4NzU0NTczNCIsImNhdGFsb2dpZCI6IiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjY3MzczNDQzMDIwODc1NDU3MzQiLCJpbWFnZURvY2lkIjoiNzc1ODQ1ODY5OTIyMzg5NTQ0MSIsInJkcyI6IlBDXzMxODMxOTgzNjk5OTE0MzM1NDJ8UFJPRF9QQ18zMTgzMTk4MzY5OTkxNDMzNTQyIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiNjczNzM0NDMwMjA4NzU0NTczNCIsImNhdGFsb2dpZCI6IiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjY3MzczNDQzMDIwODc1NDU3MzQiLCJpbWFnZURvY2lkIjoiNzc1ODQ1ODY5OTIyMzg5NTQ0MSIsInJkcyI6IlBDXzMxODMxOTgzNjk5OTE0MzM1NDJ8UFJPRF9QQ18zMTgzMTk4MzY5OTkxNDMzNTQyIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //       source: "eBay",
    //       source_icon:
    //         "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcSN1XmQeJU_yT0zcxhHYWuffZKmEBeCLcmLdkaZM422mZbdDohDeZ1F0htTlz68NMC5ys71nX8kDNtoHo_3z5uYipJX7A",
    //       price: "$40.00",
    //       extracted_price: 40,
    //       rating: 5,
    //       reviews: 1,
    //       thumbnail:
    //         "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQzU3t5zne2t6W-NfK6tWi78VoR52IyukOR5KbT1on7WE9fZ6tL6kdZ0aFD7TDdgchSCQKdmoK8lMGBZ9JtHZdkQZjFh6sVZWCfUWnY6R-SUylBlTY5Vnp7jg",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/WWt0oXicDclJDoIwFADQEwGKoQiJMYLigGIYG7vTlkmgrfa7wFN5HW-jb_u-nwZAKtcwSk6fo4SSaXDjU71WcIWW6lQMhmqElC2vl4_F_9xVxJwtjd_5DKw3L01AWIuqEAFu7XkhEsvcj6_unFjhLZsKbuONUxEER9QxMrkGaztbs5o2qR-HbBDhvD9tPeIcYEdYF5N70CBVEOxXOeYXlGhpPvZen12sgkv7Xv8AXlA95A",
    //     },
    //     {
    //       position: 32,
    //       title: "Zara Women's Pleated Wide Leg Pants",
    //       product_id: "18125161350516975912",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=18125161350516975912",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:18125161350516975912,headlineOfferDocid:2362835792765728580,imageDocid:5942248354176398243,gpcid:2457009683749966038,mid:576462847869539626,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTgxMjUxNjEzNTA1MTY5NzU5MTIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIyMzYyODM1NzkyNzY1NzI4NTgwIiwiaW1hZ2VEb2NpZCI6IjU5NDIyNDgzNTQxNzYzOTgyNDMiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIyNDU3MDA5NjgzNzQ5OTY2MDM4IiwibWlkIjoiNTc2NDYyODQ3ODY5NTM5NjI2IiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTgxMjUxNjEzNTA1MTY5NzU5MTIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIyMzYyODM1NzkyNzY1NzI4NTgwIiwiaW1hZ2VEb2NpZCI6IjU5NDIyNDgzNTQxNzYzOTgyNDMiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIyNDU3MDA5NjgzNzQ5OTY2MDM4IiwibWlkIjoiNTc2NDYyODQ3ODY5NTM5NjI2IiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //       source: "Zara USA",
    //       source_icon:
    //         "https://encrypted-tbn1.gstatic.com/favicon-tbn?q=tbn%3AANd9GcSN0khTgyojqfj_ZqNbM8fDglE4cUYLRi0GfH-sanXaLAkwPl_swXz0__69HliBabFTVq-qZx8EAcn1SV-42kSaa1vVj24",
    //       price: "$59.90",
    //       extracted_price: 59.9,
    //       rating: null,
    //       thumbnail:
    //         "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcSPJ3o0gmLop8NhE0GGQGXJed-_9qAbqnLB8d6DToK0DoUTPFijbeDBKKzqcsGvUzF5BowrWpLGyuegODDEzTs5sKbyOJ3oIE1-7WFBySi6fb3zOJlppLIGXQ",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/a3BmsHicDczbCoIwAIDhJ_IQoqkQoUyHBzygoXfRpuki3XSrcE_V6_Q2ef3z_b_vKATjrqb1M143JvpOEWg21IGLmyBYxXTS-EgZI_NwXk57c72scyCuitig-jCllNnZGOgQlrCNd351Fg8tc-rbnQVqmuiAXuoiJA_UAz9J5II5fF9kaPr0szYshdurH3IAAllzkydoy_dxFByUYxP6W0WsOzJkHj8ZSyPYln94Wz5F",
    //     },
    //     {
    //       position: 33,
    //       title: "UNIQLO Women's Gingham Flannel Pants",
    //       product_id: "1366925474418826765",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=1366925474418826765",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:1366925474418826765,headlineOfferDocid:4563157154659496690,imageDocid:5966704317899011040,gpcid:4355263495489034770,mid:576462899921977764,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTM2NjkyNTQ3NDQxODgyNjc2NSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjQ1NjMxNTcxNTQ2NTk0OTY2OTAiLCJpbWFnZURvY2lkIjoiNTk2NjcwNDMxNzg5OTAxMTA0MCIsInJkcyI6IiIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IjQzNTUyNjM0OTU0ODkwMzQ3NzAiLCJtaWQiOiI1NzY0NjI4OTk5MjE5Nzc3NjQiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ==",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTM2NjkyNTQ3NDQxODgyNjc2NSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjQ1NjMxNTcxNTQ2NTk0OTY2OTAiLCJpbWFnZURvY2lkIjoiNTk2NjcwNDMxNzg5OTAxMTA0MCIsInJkcyI6IiIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IjQzNTUyNjM0OTU0ODkwMzQ3NzAiLCJtaWQiOiI1NzY0NjI4OTk5MjE5Nzc3NjQiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ%3D%3D",
    //       source: "Uniqlo",
    //       source_icon:
    //         "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcSIeGkqa_kLTVTNyArc66HNnsOSdtKhl2aZWkdvbZK2dNO3aDtdhgnkxYbvak3yBel2AkvRjLIqaeuToJkkih0J8TbSZ7HA3w",
    //       price: "$39.90",
    //       extracted_price: 39.9,
    //       rating: null,
    //       thumbnail:
    //         "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcS4SwOsnL9ZLVbZb6BN374_V99nc8OHAFHDTI3I1Jt_yuMHQE68B1TAjRr-lyG6J6Zh-veEu_V5rz_RHEur6BiGLMIMRwdZnbTk1hvSQbS4kn4M64nmcSIZ",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/w2Gt23icDcnbDkMwAADQL8JE1yFZFjJziUuoeOhLs5Zgpowi9lH7n_3Ndl7P99MIMc6molScTfsoqlISlB_kehZ30TKZDb0yN8M4try-vM7_M624NFyGANqSmYcGDguKKbRj7QRIYRic6Yln3bxr7mu-GgiyL5GXOlC31dx6ZJP03F0YQNxIa-UspDhOb5J5zjJBu3XDyI-yrcSc5p3arCilCHQcRBDwniEf_wCLzzw1",
    //       delivery: "Free delivery on $99+",
    //     },
    //     {
    //       position: 34,
    //       title: "Lululemon Men's Woven Classic-Fit Pleated Trousers",
    //       product_id: "8134761733313011044",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=8134761733313011044",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:8134761733313011044,headlineOfferDocid:15198870067645302863,imageDocid:1079769412128648507,rds:PC_11787740997657605202|PROD_PC_11787740997657605202,gpcid:11787740997657605202,mid:576462861877388360,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiODEzNDc2MTczMzMxMzAxMTA0NCIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjE1MTk4ODcwMDY3NjQ1MzAyODYzIiwiaW1hZ2VEb2NpZCI6IjEwNzk3Njk0MTIxMjg2NDg1MDciLCJyZHMiOiJQQ18xMTc4Nzc0MDk5NzY1NzYwNTIwMnxQUk9EX1BDXzExNzg3NzQwOTk3NjU3NjA1MjAyIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiMTE3ODc3NDA5OTc2NTc2MDUyMDIiLCJtaWQiOiI1NzY0NjI4NjE4NzczODgzNjAiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ==",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiODEzNDc2MTczMzMxMzAxMTA0NCIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjE1MTk4ODcwMDY3NjQ1MzAyODYzIiwiaW1hZ2VEb2NpZCI6IjEwNzk3Njk0MTIxMjg2NDg1MDciLCJyZHMiOiJQQ18xMTc4Nzc0MDk5NzY1NzYwNTIwMnxQUk9EX1BDXzExNzg3NzQwOTk3NjU3NjA1MjAyIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiMTE3ODc3NDA5OTc2NTc2MDUyMDIiLCJtaWQiOiI1NzY0NjI4NjE4NzczODgzNjAiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ%3D%3D",
    //       source: "lululemon",
    //       source_icon:
    //         "https://encrypted-tbn2.gstatic.com/favicon-tbn?q=tbn%3AANd9GcQDt6ozOQC7ydSlFCylBJTzrF6G0sOhC1ncpbjl-jyMdC4aWpxhkceYxRNmyUSvEy553iojap0nn3SDSURWhTHgr7P2F0xixjwRJks",
    //       price: "$84.00",
    //       extracted_price: 84,
    //       old_price: "$128",
    //       extracted_old_price: 128,
    //       rating: 4.8,
    //       reviews: 6,
    //       thumbnail:
    //         "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQU_K80nPfzfm9wLDdaYLEI15oApWKVQ6nCj5Rio67kNYxHpUQ6sR5pzoRfo0Ae9iIbEfIJvoQCxCqZnUYXTQBx-vWe3IhtXjBeEbW2yZdqOjEFqoBVxGc",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/sAnt7XicDclJDoIwAADAF7EoAYXEGEBEhKAlsl4MlLIZ2iINgn_yQf5G5zrfT8MYHTVBQBg-F8pQybECS3w9spy1kIekF8aGUNriej_s_qfpfqnaEIR3dyvia_WuevXlHco89SxnJROdxm4EFGx2ctASZfPw0_lEQ6CMgUzfJKiIqCO1dQqrcs4TAeZsDhkO0-QGjJmbYiQ5DUs6A1lFvF6ycrh01nEgRjTb8AfeaT4U",
    //       tag: "34% OFF",
    //       extensions: ["34% OFF"],
    //       delivery: "Free delivery by Fri",
    //     },
    //     {
    //       position: 35,
    //       title: "Gap Women's 365 Low Rise Pleated Wide-leg Trousers",
    //       product_id: "17376650723833512023",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=17376650723833512023",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:17376650723833512023,headlineOfferDocid:933305801113077233,imageDocid:4557052693676521424,rds:PC_2618084815459764672|PROD_PC_2618084815459764672,gpcid:2618084815459764672,mid:576462833087050541,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTczNzY2NTA3MjM4MzM1MTIwMjMiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiI5MzMzMDU4MDExMTMwNzcyMzMiLCJpbWFnZURvY2lkIjoiNDU1NzA1MjY5MzY3NjUyMTQyNCIsInJkcyI6IlBDXzI2MTgwODQ4MTU0NTk3NjQ2NzJ8UFJPRF9QQ18yNjE4MDg0ODE1NDU5NzY0NjcyIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiMjYxODA4NDgxNTQ1OTc2NDY3MiIsIm1pZCI6IjU3NjQ2MjgzMzA4NzA1MDU0MSIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTczNzY2NTA3MjM4MzM1MTIwMjMiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiI5MzMzMDU4MDExMTMwNzcyMzMiLCJpbWFnZURvY2lkIjoiNDU1NzA1MjY5MzY3NjUyMTQyNCIsInJkcyI6IlBDXzI2MTgwODQ4MTU0NTk3NjQ2NzJ8UFJPRF9QQ18yNjE4MDg0ODE1NDU5NzY0NjcyIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiMjYxODA4NDgxNTQ1OTc2NDY3MiIsIm1pZCI6IjU3NjQ2MjgzMzA4NzA1MDU0MSIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       source: "Gap",
    //       source_icon:
    //         "https://encrypted-tbn2.gstatic.com/favicon-tbn?q=tbn%3AANd9GcSLiMaYv-EDtQhWNUs9sQqk96Vc07N6r-kH8RRJAP4rNr442I1p0wQ-tADTBdRWvuC1dNtTf0NN225pxsQWv9r-mepm",
    //       multiple_sources: true,
    //       price: "$89.95",
    //       extracted_price: 89.95,
    //       rating: 4.7,
    //       reviews: 37,
    //       thumbnail:
    //         "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQIxSGB8z-g4jm8JHxPG1P3Y2jcnI1SNerGNHUrWFnV7cI6-aU1Ree5XsA4nLtglkl74j3CI4xhrBEglExKj8faSKeiew9u4zOE2DhkFQcEpyPddHBV1kzzZ6SZ",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/8iiYpnicDclJDoIwAADAFyGClcXEGFGWikGQuN6wrYUCpUKNyLP8jb_Ruc73k0spupmqEo7at5AEK_LGxyPayUwWaISaWu3yRoiC08Vj_r_ZMsK2jxLYp75jDQoFrLY2QR_7Wjy56AxxqKURaf0oOLQnjx9NBA0lO2h7Qqbnbgn4VtKqrEzAJisI-rx1XFq5fcise5aGpCAv-wmGnauv89JLkCveMcaBc9TKYbga6fUHw6M-mg",
    //     },
    //     {
    //       position: 36,
    //       title: "Uniqlo Pleated Wide Trousers",
    //       product_id: "2620124638902094211",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=2620124638902094211",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=productid:2620124638902094211,headlineOfferDocid:2620124638902094211,imageDocid:11545268970034070356,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMjYyMDEyNDYzODkwMjA5NDIxMSIsImNhdGFsb2dpZCI6IiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjI2MjAxMjQ2Mzg5MDIwOTQyMTEiLCJpbWFnZURvY2lkIjoiMTE1NDUyNjg5NzAwMzQwNzAzNTYiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ==",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMjYyMDEyNDYzODkwMjA5NDIxMSIsImNhdGFsb2dpZCI6IiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjI2MjAxMjQ2Mzg5MDIwOTQyMTEiLCJpbWFnZURvY2lkIjoiMTE1NDUyNjg5NzAwMzQwNzAzNTYiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ%3D%3D",
    //       source: "Poshmark",
    //       source_icon:
    //         "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcQgE5YW9q7ce-TY-ORlvWjWfhcq61HU1-cph5DDKWEFIARUAQSdI7Q7a_t3VW7jGLqcgcFb_1KWHtfMCXQ2pUUEd_NU0jU",
    //       price: "$30.00",
    //       extracted_price: 30,
    //       second_hand_condition: "pre-owned",
    //       rating: null,
    //       thumbnail:
    //         "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcT_mfXJwTkfh2pwc0CEet-XUuZqzbk7AVEBhyWzH3teM9PdBoCTzlICsfP9bjnfYQKywYs-gLDbT7zh2c962wRYB-6K-I5qnG1vNJPY05L-",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/6_TN8HicDcn_DkJAAADgJzqkYWytIZMfmZqK_mk5zknO6a5uPE5v1dvU9-_3_WDOKbNkuSbwOVFeV4CXRJEaxm-8hRIcepnhgdKWNOtx9T_LTirTh9m1R3kosg5hlQqouF7NQX58Xca57Az75Dl4Os_bJa93Zlo5g5vNj8BlKDXLO0HFPppEwUATb8rMmLEKTV0Vh8IBegQCbST-4p2EaaFoMfgBjUE5hg",
    //       tag: "40% OFF",
    //       extensions: ["40% OFF"],
    //     },
    //     {
    //       position: 37,
    //       title: "Uniqlo Women's Pleated Tuck Wide Pants",
    //       product_id: "6623045559464534753",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=6623045559464534753",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=productid:6623045559464534753,headlineOfferDocid:6623045559464534753,imageDocid:11254001304611064715,rds:PC_17203830047843546771|PROD_PC_17203830047843546771,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiNjYyMzA0NTU1OTQ2NDUzNDc1MyIsImNhdGFsb2dpZCI6IiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjY2MjMwNDU1NTk0NjQ1MzQ3NTMiLCJpbWFnZURvY2lkIjoiMTEyNTQwMDEzMDQ2MTEwNjQ3MTUiLCJyZHMiOiJQQ18xNzIwMzgzMDA0Nzg0MzU0Njc3MXxQUk9EX1BDXzE3MjAzODMwMDQ3ODQzNTQ2NzcxIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiNjYyMzA0NTU1OTQ2NDUzNDc1MyIsImNhdGFsb2dpZCI6IiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjY2MjMwNDU1NTk0NjQ1MzQ3NTMiLCJpbWFnZURvY2lkIjoiMTEyNTQwMDEzMDQ2MTEwNjQ3MTUiLCJyZHMiOiJQQ18xNzIwMzgzMDA0Nzg0MzU0Njc3MXxQUk9EX1BDXzE3MjAzODMwMDQ3ODQzNTQ2NzcxIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //       source: "eBay - manyos_78",
    //       source_icon:
    //         "https://encrypted-tbn1.gstatic.com/favicon-tbn?q=tbn%3AANd9GcRR0_zHnaJ3qErUF0QmVnyDMkZsagL2saaoEuixfD9kcC3BfifYr-i6Mb1745RdfmGPuusArl4AC2obvdP1BwJRoInAlVM",
    //       price: "$59.00",
    //       extracted_price: 59,
    //       rating: 5,
    //       reviews: 2,
    //       thumbnail:
    //         "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcRKV8PBZ9GgdTwUrNOC9HPH1F1maHb-GK3z38UniVvLy-9CpqqdcitQJA7T0O48DHk0N-Wp2M8mFjdK-RwnohA5fdoewYvsWqcy5SzUJ47LdHKICZR-SQgJEQ",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/tzdN1HicDcnbEkJAAADQL1qXMGimaaTYELlP3tgVaqyVHUZf1e_0N3Vez_fTMkanLc_XBL1WymoMWEUkrplYyTrEoaHnp3agtCPNftz9b2v4WLdR5Gba9VDodoOTJX35ganDKxQtsS9hBWxXektaSrps9lagm3QcMepY6BhqIgSydoRPwQc53Vy03npgF0QLGVpDueOhXm7zlI9oVeJ36siqh6F7NosIxGHjnMIfIqc88g",
    //     },
    //     {
    //       position: 38,
    //       title: "Zara Men's Pleated Flowy Pants",
    //       product_id: "8390460837561623861",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=8390460837561623861",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:8390460837561623861,headlineOfferDocid:15280803805110322768,imageDocid:1220656867574680284,gpcid:11091129470577640535,mid:576462839499365991,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiODM5MDQ2MDgzNzU2MTYyMzg2MSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjE1MjgwODAzODA1MTEwMzIyNzY4IiwiaW1hZ2VEb2NpZCI6IjEyMjA2NTY4Njc1NzQ2ODAyODQiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIxMTA5MTEyOTQ3MDU3NzY0MDUzNSIsIm1pZCI6IjU3NjQ2MjgzOTQ5OTM2NTk5MSIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiODM5MDQ2MDgzNzU2MTYyMzg2MSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjE1MjgwODAzODA1MTEwMzIyNzY4IiwiaW1hZ2VEb2NpZCI6IjEyMjA2NTY4Njc1NzQ2ODAyODQiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIxMTA5MTEyOTQ3MDU3NzY0MDUzNSIsIm1pZCI6IjU3NjQ2MjgzOTQ5OTM2NTk5MSIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //       source: "Zara USA",
    //       source_icon:
    //         "https://encrypted-tbn1.gstatic.com/favicon-tbn?q=tbn%3AANd9GcSN0khTgyojqfj_ZqNbM8fDglE4cUYLRi0GfH-sanXaLAkwPl_swXz0__69HliBabFTVq-qZx8EAcn1SV-42kSaa1vVj24",
    //       price: "$79.90",
    //       extracted_price: 79.9,
    //       rating: null,
    //       thumbnail:
    //         "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQqU2AuyWP6-wRIxCiKz1WIuxs3jlpjaN3rwCO6e6FGEScwJs-Csy_fdA2Qn4t3hxAds3jS_kJ4MGgGFUXRJ8wbMx1pWDYbR6IcylcXiJVY-mQ5tCHvDXAIPos",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/9-IhjXicDcrbEkJAAADQL0IumTLTNDtENOQywpNhySWXZVfor_qc_ibP5_y-JSEISwyTd3BcEckziqTdji4wSUgFadi3DC57hKquOA-nzSRgZUcNOoPPgWkNbJGaXX2Rq9uHDfRpwXzdoDqx-HGW72IuqtrFg7OBKRmv8TMDnNMJhC8XkG3Ti1-GYGqFpvqhaxzm1FxYFChR6oo6XBsYVsYjolpnT-TrWwmBbvf4D_e4PyU",
    //     },
    //     {
    //       position: 39,
    //       title: "Free People Paige Pleated Wide-Leg Pants",
    //       product_id: "9579304775520084291",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=9579304775520084291",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:9579304775520084291,headlineOfferDocid:13367297228422896689,imageDocid:6469573932897478394,rds:PC_10734776855509734364|PROD_PC_10734776855509734364,gpcid:10734776855509734364,mid:576462814263574331,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiOTU3OTMwNDc3NTUyMDA4NDI5MSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjEzMzY3Mjk3MjI4NDIyODk2Njg5IiwiaW1hZ2VEb2NpZCI6IjY0Njk1NzM5MzI4OTc0NzgzOTQiLCJyZHMiOiJQQ18xMDczNDc3Njg1NTUwOTczNDM2NHxQUk9EX1BDXzEwNzM0Nzc2ODU1NTA5NzM0MzY0IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiMTA3MzQ3NzY4NTU1MDk3MzQzNjQiLCJtaWQiOiI1NzY0NjI4MTQyNjM1NzQzMzEiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ==",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiOTU3OTMwNDc3NTUyMDA4NDI5MSIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjEzMzY3Mjk3MjI4NDIyODk2Njg5IiwiaW1hZ2VEb2NpZCI6IjY0Njk1NzM5MzI4OTc0NzgzOTQiLCJyZHMiOiJQQ18xMDczNDc3Njg1NTUwOTczNDM2NHxQUk9EX1BDXzEwNzM0Nzc2ODU1NTA5NzM0MzY0IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiMTA3MzQ3NzY4NTU1MDk3MzQzNjQiLCJtaWQiOiI1NzY0NjI4MTQyNjM1NzQzMzEiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ%3D%3D",
    //       source: "Free People",
    //       source_icon:
    //         "https://encrypted-tbn2.gstatic.com/favicon-tbn?q=tbn%3AANd9GcQLL9bSLKWzAv-Yw95N_STfvvVwhVCUSYBRhSoZYS1mct534LJptHLIXbejkh_bYFYk_nJUN6e0kGHUdP4lmkeJB2sVGeOeVVEYpKI",
    //       multiple_sources: true,
    //       price: "$98.00",
    //       extracted_price: 98,
    //       rating: 3.8,
    //       reviews: 17,
    //       thumbnail:
    //         "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTDUPzmu5VJ1BWOggBwrewoxEvix1imlru_Ej29CuI_u115s_fBlP3ZaoeHKtkqMXHsyiLM-oPtaJWT9Ah8sOamu2Uc2QCcc03pmZmzWPJVbD0Y5iP_CWqqQC0",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/HyP_o3icDcnbDoIgAADQL_La3NKtNbWW2Q23yuqFERJSIijQ7a_6nP6mzuv5fmqtpYoch7S4f0lNKkufW9-mSiPNsI0Fd1QtpGQtHXej_0XxugpneDvZgTc3wT73knJDafLoyUM8p3f29BhvegOnVz9MzRwazwsUvCQNGJyQINlC37rVIVMvtlxZAmiUl9swrodqg7jxd9gvUozdgeQn_i5Bvj9P3GPAAEzLritS9wdEyT_M",
    //       delivery: "Free delivery",
    //     },
    //     {
    //       position: 40,
    //       title: "Gap Women's 365 High Rise Ultrasoft Pleated Denim Trousers",
    //       product_id: "8716855985712928474",
    //       serpapi_product_api:
    //         "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=8716855985712928474",
    //       product_link:
    //         "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:8716855985712928474,headlineOfferDocid:13696900881399543722,imageDocid:7772779602611695327,rds:PC_5223978227566004715|PROD_PC_5223978227566004715,gpcid:5223978227566004715,mid:576462516938002416,pvt:a&hl=en&gl=us&udm=28",
    //       immersive_product_page_token:
    //         "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiODcxNjg1NTk4NTcxMjkyODQ3NCIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjEzNjk2OTAwODgxMzk5NTQzNzIyIiwiaW1hZ2VEb2NpZCI6Ijc3NzI3Nzk2MDI2MTE2OTUzMjciLCJyZHMiOiJQQ181MjIzOTc4MjI3NTY2MDA0NzE1fFBST0RfUENfNTIyMzk3ODIyNzU2NjAwNDcxNSIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IjUyMjM5NzgyMjc1NjYwMDQ3MTUiLCJtaWQiOiI1NzY0NjI1MTY5MzgwMDI0MTYiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ==",
    //       serpapi_immersive_product_api:
    //         "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiODcxNjg1NTk4NTcxMjkyODQ3NCIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjEzNjk2OTAwODgxMzk5NTQzNzIyIiwiaW1hZ2VEb2NpZCI6Ijc3NzI3Nzk2MDI2MTE2OTUzMjciLCJyZHMiOiJQQ181MjIzOTc4MjI3NTY2MDA0NzE1fFBST0RfUENfNTIyMzk3ODIyNzU2NjAwNDcxNSIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IjUyMjM5NzgyMjc1NjYwMDQ3MTUiLCJtaWQiOiI1NzY0NjI1MTY5MzgwMDI0MTYiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ%3D%3D",
    //       source: "Gap",
    //       source_icon:
    //         "https://encrypted-tbn2.gstatic.com/favicon-tbn?q=tbn%3AANd9GcSLiMaYv-EDtQhWNUs9sQqk96Vc07N6r-kH8RRJAP4rNr442I1p0wQ-tADTBdRWvuC1dNtTf0NN225pxsQWv9r-mepm",
    //       price: "$89.95",
    //       extracted_price: 89.95,
    //       rating: 4.2,
    //       reviews: 75,
    //       thumbnail:
    //         "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcSanC2CUxWz7_u1IvIE9HCYbemUzm-5gMzPBGLD5tDwZUPAV88mzHxK6iuHkk_aZxPMerCK3beyILMSg7HnXT950xw7tDImALg2syx8wdKmaAxegGu-yf5hym4",
    //       serpapi_thumbnail:
    //         "https://serpapi.com/images/url/CVfpuHicDcnbDkMwAADQL8JmM5dkWawWBIvE7OJFiq5EWkZN66_2Ofub7bye76dmrB8tRUG0HETPUCWxgm5kPDLImlIuO6KMddf3DcWH1_5_ln2uTLdMIAUqSPlt0fNp7b_9k-mBR4FIuhBJw9ESH93Q0ZgzZ2lsXw2DLB4Pds3ktW0OMx5HaADBpkDCD6ME6x69X0xtxWedOT6xQ6yOghtzFRBoc4TdSRJPrRZk-wPa8D9n",
    //     },
    //   ],
    //   categorized_shopping_results: [
    //     {
    //       title: "Wide-leg Uniqlo pleated trousers",
    //       shopping_results: [
    //         {
    //           position: 1,
    //           title: "UNIQLO Men's Pleated Wide Pants",
    //           product_id: "6266015511773730422",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=6266015511773730422",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:6266015511773730422,headlineOfferDocid:17999028462967131449,imageDocid:6267610566977729456,gpcid:6145078773191752237,mid:576462511164041558,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiNjI2NjAxNTUxMTc3MzczMDQyMiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjE3OTk5MDI4NDYyOTY3MTMxNDQ5IiwiaW1hZ2VEb2NpZCI6IjYyNjc2MTA1NjY5Nzc3Mjk0NTYiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI2MTQ1MDc4NzczMTkxNzUyMjM3IiwibWlkIjoiNTc2NDYyNTExMTY0MDQxNTU4IiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiNjI2NjAxNTUxMTc3MzczMDQyMiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjE3OTk5MDI4NDYyOTY3MTMxNDQ5IiwiaW1hZ2VEb2NpZCI6IjYyNjc2MTA1NjY5Nzc3Mjk0NTYiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI2MTQ1MDc4NzczMTkxNzUyMjM3IiwibWlkIjoiNTc2NDYyNTExMTY0MDQxNTU4IiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //           source: "Uniqlo",
    //           source_icon:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f0508b2905185e6df0439b23c0eb061b496d75a512a666c39f27ee5a2b19cb42dc43a5ae1dfa4a93987e.png",
    //           multiple_sources: true,
    //           price: "$49.90",
    //           extracted_price: 49.9,
    //           rating: null,
    //           thumbnail:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f0508b2905185e6df0439b23c0eb061b496d75a512a666c39f27c5ae4247459d068cafb78f9608e321fe.webp",
    //           delivery: "Free delivery on $99+",
    //         },
    //         {
    //           position: 2,
    //           title: "UNIQLO Pleated Wide Brushed Jersey Trousers",
    //           product_id: "12824397898205488817",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=12824397898205488817",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:12824397898205488817,headlineOfferDocid:17038324915319025940,imageDocid:6225355268328441500,gpcid:9375764651562891955,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTI4MjQzOTc4OTgyMDU0ODg4MTciLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNzAzODMyNDkxNTMxOTAyNTk0MCIsImltYWdlRG9jaWQiOiI2MjI1MzU1MjY4MzI4NDQxNTAwIiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiOTM3NTc2NDY1MTU2Mjg5MTk1NSIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTI4MjQzOTc4OTgyMDU0ODg4MTciLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNzAzODMyNDkxNTMxOTAyNTk0MCIsImltYWdlRG9jaWQiOiI2MjI1MzU1MjY4MzI4NDQxNTAwIiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiOTM3NTc2NDY1MTU2Mjg5MTk1NSIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //           source: "Uniqlo",
    //           source_icon:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f0508b2905185e6df0439b23c0eb061b496d75a512a666c39f27a573f0663acecf050aa4a1d42e7e877b.png",
    //           price: "$49.90",
    //           extracted_price: 49.9,
    //           rating: null,
    //           thumbnail:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f0508b2905185e6df0439b23c0eb061b496d75a512a666c39f27a6404747bd7c4ead790fbb1182d89aa0.webp",
    //           delivery: "Free delivery on $99+",
    //         },
    //         {
    //           position: 3,
    //           title: "UNIQLO Pleated Wide Trousers",
    //           product_id: "12388159153098237734",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=12388159153098237734",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:12388159153098237734,headlineOfferDocid:5196305422525650869,imageDocid:7575984553379814564,gpcid:8636182815236942291,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTIzODgxNTkxNTMwOTgyMzc3MzQiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiI1MTk2MzA1NDIyNTI1NjUwODY5IiwiaW1hZ2VEb2NpZCI6Ijc1NzU5ODQ1NTMzNzk4MTQ1NjQiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI4NjM2MTgyODE1MjM2OTQyMjkxIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTIzODgxNTkxNTMwOTgyMzc3MzQiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiI1MTk2MzA1NDIyNTI1NjUwODY5IiwiaW1hZ2VEb2NpZCI6Ijc1NzU5ODQ1NTMzNzk4MTQ1NjQiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI4NjM2MTgyODE1MjM2OTQyMjkxIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //           source: "Uniqlo",
    //           source_icon:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f0508b2905185e6df0439b23c0eb061b496d75a512a666c39f276974344526d8a7153f0f01ca69d68a9c.png",
    //           price: "$49.90",
    //           extracted_price: 49.9,
    //           rating: null,
    //           thumbnail:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f0508b2905185e6df0439b23c0eb061b496d75a512a666c39f272c61e7d7c8a6aa65570228707bc22968.webp",
    //           delivery: "Free delivery on $99+",
    //         },
    //         {
    //           position: 4,
    //           title: "UNIQLO Men's Pleated Wide Brushed Twill Pants",
    //           product_id: "13716378216618665062",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=13716378216618665062",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:13716378216618665062,headlineOfferDocid:14492387211800446279,imageDocid:15565683085076879053,rds:PC_6145078773191752237|PROD_PC_6145078773191752237,gpcid:6664702460424391224,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTM3MTYzNzgyMTY2MTg2NjUwNjIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNDQ5MjM4NzIxMTgwMDQ0NjI3OSIsImltYWdlRG9jaWQiOiIxNTU2NTY4MzA4NTA3Njg3OTA1MyIsInJkcyI6IlBDXzYxNDUwNzg3NzMxOTE3NTIyMzd8UFJPRF9QQ182MTQ1MDc4NzczMTkxNzUyMjM3IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiNjY2NDcwMjQ2MDQyNDM5MTIyNCIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTM3MTYzNzgyMTY2MTg2NjUwNjIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNDQ5MjM4NzIxMTgwMDQ0NjI3OSIsImltYWdlRG9jaWQiOiIxNTU2NTY4MzA4NTA3Njg3OTA1MyIsInJkcyI6IlBDXzYxNDUwNzg3NzMxOTE3NTIyMzd8UFJPRF9QQ182MTQ1MDc4NzczMTkxNzUyMjM3IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiNjY2NDcwMjQ2MDQyNDM5MTIyNCIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //           source: "Uniqlo",
    //           source_icon:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f0508b2905185e6df0439b23c0eb061b496d75a512a666c39f278879d4fb18f4bfb7da72e09a657fe79f.png",
    //           multiple_sources: true,
    //           price: "$49.90",
    //           extracted_price: 49.9,
    //           rating: 5,
    //           reviews: 1,
    //           thumbnail:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f0508b2905185e6df0439b23c0eb061b496d75a512a666c39f2718d4dd186eabb91e6997fb25bb6213a2.webp",
    //           delivery: "Free delivery on $99+",
    //         },
    //         {
    //           position: 5,
    //           title: "UNIQLO Men's Pleated Wide Tweed Pants",
    //           product_id: "13501069312706595287",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=13501069312706595287",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:13501069312706595287,headlineOfferDocid:1080605973967575032,imageDocid:7252659062843790338,rds:PC_6145078773191752237|PROD_PC_6145078773191752237,gpcid:2019237282848385776,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTM1MDEwNjkzMTI3MDY1OTUyODciLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxMDgwNjA1OTczOTY3NTc1MDMyIiwiaW1hZ2VEb2NpZCI6IjcyNTI2NTkwNjI4NDM3OTAzMzgiLCJyZHMiOiJQQ182MTQ1MDc4NzczMTkxNzUyMjM3fFBST0RfUENfNjE0NTA3ODc3MzE5MTc1MjIzNyIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IjIwMTkyMzcyODI4NDgzODU3NzYiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ==",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTM1MDEwNjkzMTI3MDY1OTUyODciLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxMDgwNjA1OTczOTY3NTc1MDMyIiwiaW1hZ2VEb2NpZCI6IjcyNTI2NTkwNjI4NDM3OTAzMzgiLCJyZHMiOiJQQ182MTQ1MDc4NzczMTkxNzUyMjM3fFBST0RfUENfNjE0NTA3ODc3MzE5MTc1MjIzNyIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IjIwMTkyMzcyODI4NDgzODU3NzYiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ%3D%3D",
    //           source: "Uniqlo",
    //           source_icon:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f0508b2905185e6df0439b23c0eb061b496d75a512a666c39f27cf9f199329b703dbed433d483f0e7c67.png",
    //           multiple_sources: true,
    //           price: "$49.90",
    //           extracted_price: 49.9,
    //           rating: 5,
    //           reviews: 1,
    //           thumbnail:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f0508b2905185e6df0439b23c0eb061b496d75a512a666c39f27aa188bffa7fc1e0ac7589fe2b1712b0c.webp",
    //           delivery: "Free delivery on $99+",
    //         },
    //         {
    //           position: 6,
    //           title: "UNIQLO Women's Smart Wide Pants",
    //           product_id: "9574577377870448774",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=9574577377870448774",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:9574577377870448774,headlineOfferDocid:11427384998633167481,imageDocid:10906581356510260862,gpcid:695878116379558140,mid:576462865235370627,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiOTU3NDU3NzM3Nzg3MDQ0ODc3NCIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjExNDI3Mzg0OTk4NjMzMTY3NDgxIiwiaW1hZ2VEb2NpZCI6IjEwOTA2NTgxMzU2NTEwMjYwODYyIiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiNjk1ODc4MTE2Mzc5NTU4MTQwIiwibWlkIjoiNTc2NDYyODY1MjM1MzcwNjI3IiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiOTU3NDU3NzM3Nzg3MDQ0ODc3NCIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjExNDI3Mzg0OTk4NjMzMTY3NDgxIiwiaW1hZ2VEb2NpZCI6IjEwOTA2NTgxMzU2NTEwMjYwODYyIiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiNjk1ODc4MTE2Mzc5NTU4MTQwIiwibWlkIjoiNTc2NDYyODY1MjM1MzcwNjI3IiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //           source: "Uniqlo",
    //           source_icon:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f0508b2905185e6df0439b23c0eb061b496d75a512a666c39f27f2cc95a48deb81f73b999c7a5ab1165b.png",
    //           multiple_sources: true,
    //           price: "$49.90",
    //           extracted_price: 49.9,
    //           rating: null,
    //           thumbnail:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f0508b2905185e6df0439b23c0eb061b496d75a512a666c39f2752614775dedce79e673c2ca243b78c69.webp",
    //           delivery: "Free delivery on $99+",
    //         },
    //         {
    //           position: 7,
    //           title: "Uniqlo Pleated Wide Leg Baggy Khaki Dress",
    //           product_id: "6737344302087545734",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=6737344302087545734",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=productid:6737344302087545734,headlineOfferDocid:6737344302087545734,imageDocid:7758458699223895441,rds:PC_3183198369991433542|PROD_PC_3183198369991433542,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiNjczNzM0NDMwMjA4NzU0NTczNCIsImNhdGFsb2dpZCI6IiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjY3MzczNDQzMDIwODc1NDU3MzQiLCJpbWFnZURvY2lkIjoiNzc1ODQ1ODY5OTIyMzg5NTQ0MSIsInJkcyI6IlBDXzMxODMxOTgzNjk5OTE0MzM1NDJ8UFJPRF9QQ18zMTgzMTk4MzY5OTkxNDMzNTQyIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiNjczNzM0NDMwMjA4NzU0NTczNCIsImNhdGFsb2dpZCI6IiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjY3MzczNDQzMDIwODc1NDU3MzQiLCJpbWFnZURvY2lkIjoiNzc1ODQ1ODY5OTIyMzg5NTQ0MSIsInJkcyI6IlBDXzMxODMxOTgzNjk5OTE0MzM1NDJ8UFJPRF9QQ18zMTgzMTk4MzY5OTkxNDMzNTQyIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //           source: "eBay",
    //           source_icon:
    //             "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcSN1XmQeJU_yT0zcxhHYWuffZKmEBeCLcmLdkaZM422mZbdDohDeZ1F0htTlz68NMC5ys71nX8kDNtoHo_3z5uYipJX7A",
    //           price: "$40.00",
    //           extracted_price: 40,
    //           rating: 5,
    //           reviews: 1,
    //           thumbnail:
    //             "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcT_HHLV4L-KijpmGfVfTbN7vc0LX8CncDjCfA5H57wW_zN39ZAT8pBbRP1wXoVjUAxG-EsArh_KSgOM6fh7OfiqSvEhTsqd8pve2YnCizllEed-Tx2akG9v7A",
    //           serpapi_thumbnail:
    //             "https://serpapi.com/images/url/607ULnicDc7hDkJAAADgJ5JUQltrl4wt0XJJ_TGOc6c6x92knqrX6W3y-_vz_b5ESi5Wqloy1L25LAtF5kybVEJmkqIJap6qIA3nlFWbdj3aCgSF5SKYep4fL3xlT2v-dHGMYR4YPZr6iWkztKttDHRPN16X9BPMrRuAJt_mp6P2Spq4PoPBVRwBOpLuoyo8LDExQkzbqHcIFG1h8r6cXZlNP4-HM57gMMvurtUb4A9mzD5d",
    //         },
    //         {
    //           position: 8,
    //           title: "Uniqlo Pleated Wide Trousers",
    //           product_id: "2620124638902094211",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=2620124638902094211",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=productid:2620124638902094211,headlineOfferDocid:2620124638902094211,imageDocid:11545268970034070356,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMjYyMDEyNDYzODkwMjA5NDIxMSIsImNhdGFsb2dpZCI6IiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjI2MjAxMjQ2Mzg5MDIwOTQyMTEiLCJpbWFnZURvY2lkIjoiMTE1NDUyNjg5NzAwMzQwNzAzNTYiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ==",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMjYyMDEyNDYzODkwMjA5NDIxMSIsImNhdGFsb2dpZCI6IiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjI2MjAxMjQ2Mzg5MDIwOTQyMTEiLCJpbWFnZURvY2lkIjoiMTE1NDUyNjg5NzAwMzQwNzAzNTYiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ%3D%3D",
    //           source: "Poshmark",
    //           source_icon:
    //             "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcQgE5YW9q7ce-TY-ORlvWjWfhcq61HU1-cph5DDKWEFIARUAQSdI7Q7a_t3VW7jGLqcgcFb_1KWHtfMCXQ2pUUEd_NU0jU",
    //           price: "$30.00",
    //           extracted_price: 30,
    //           second_hand_condition: "pre-owned",
    //           rating: null,
    //           thumbnail:
    //             "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcTuUyyrSaoE6m-uyYaVnmMVBO9ixX9Gsi5u-36SVU5cA2XH0NS_FCg6OJGXenzRUWaNzdrdJFI_df9EAu6IrfxXqkVuxl82k-PcQ2pAEL-R",
    //           serpapi_thumbnail:
    //             "https://serpapi.com/images/url/vMK_VXicDcltCoIwAADQE03FUFKIsFBTSktz2S-xzY9hzuk2UI_TrbpNvb_v-2mFYNxW1YqiaWGiwkC8qKY0XJSCIAUNvcrbgTFCm_24-5_tRNjy0V1myzKl5eCaPZDLs4S0v8BDbJE5t3xODAk2ZgozAzl6ftKitPCOjRmHfl7RNckeZbTiCYdeUODach1pBlM952MH5fze6h24opvOHPcMkh9guTmz",
    //           tag: "40% OFF",
    //           extensions: ["40% OFF"],
    //         },
    //       ],
    //     },
    //     {
    //       title: "Cotton Uniqlo pleated trousers",
    //       shopping_results: [
    //         {
    //           position: 1,
    //           title: "UNIQLO Men's Pleated Wide Pants",
    //           product_id: "6266015511773730422",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=6266015511773730422",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:6266015511773730422,headlineOfferDocid:17999028462967131449,imageDocid:6267610566977729456,gpcid:6145078773191752237,mid:576462511164041558,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiNjI2NjAxNTUxMTc3MzczMDQyMiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjE3OTk5MDI4NDYyOTY3MTMxNDQ5IiwiaW1hZ2VEb2NpZCI6IjYyNjc2MTA1NjY5Nzc3Mjk0NTYiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI2MTQ1MDc4NzczMTkxNzUyMjM3IiwibWlkIjoiNTc2NDYyNTExMTY0MDQxNTU4IiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiNjI2NjAxNTUxMTc3MzczMDQyMiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjE3OTk5MDI4NDYyOTY3MTMxNDQ5IiwiaW1hZ2VEb2NpZCI6IjYyNjc2MTA1NjY5Nzc3Mjk0NTYiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI2MTQ1MDc4NzczMTkxNzUyMjM3IiwibWlkIjoiNTc2NDYyNTExMTY0MDQxNTU4IiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //           source: "Uniqlo",
    //           source_icon:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f050280b0171e97b0e2de0cc591efa5458b94c35ba771f7a7572a44ea4bfe395870876db413ee8a3d70a.png",
    //           multiple_sources: true,
    //           price: "$49.90",
    //           extracted_price: 49.9,
    //           rating: null,
    //           thumbnail:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f050280b0171e97b0e2de0cc591efa5458b94c35ba771f7a7572a5a73e1a7da4cc2548e6df83b05b6474.webp",
    //           delivery: "Free delivery on $99+",
    //         },
    //         {
    //           position: 2,
    //           title: "UNIQLO Pleated Wide Brushed Jersey Trousers",
    //           product_id: "12824397898205488817",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=12824397898205488817",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:12824397898205488817,headlineOfferDocid:17038324915319025940,imageDocid:6225355268328441500,gpcid:9375764651562891955,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTI4MjQzOTc4OTgyMDU0ODg4MTciLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNzAzODMyNDkxNTMxOTAyNTk0MCIsImltYWdlRG9jaWQiOiI2MjI1MzU1MjY4MzI4NDQxNTAwIiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiOTM3NTc2NDY1MTU2Mjg5MTk1NSIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTI4MjQzOTc4OTgyMDU0ODg4MTciLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNzAzODMyNDkxNTMxOTAyNTk0MCIsImltYWdlRG9jaWQiOiI2MjI1MzU1MjY4MzI4NDQxNTAwIiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiOTM3NTc2NDY1MTU2Mjg5MTk1NSIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //           source: "Uniqlo",
    //           source_icon:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f050280b0171e97b0e2de0cc591efa5458b94c35ba771f7a7572e68da808ca59e0e1cadfd57fb355b984.png",
    //           price: "$49.90",
    //           extracted_price: 49.9,
    //           rating: null,
    //           thumbnail:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f050280b0171e97b0e2de0cc591efa5458b94c35ba771f7a7572d26d145c35c40470b2c01dde223c179f.webp",
    //           delivery: "Free delivery on $99+",
    //         },
    //         {
    //           position: 3,
    //           title: "UNIQLO Pleated Wide Trousers",
    //           product_id: "12388159153098237734",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=12388159153098237734",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:12388159153098237734,headlineOfferDocid:5196305422525650869,imageDocid:7575984553379814564,gpcid:8636182815236942291,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTIzODgxNTkxNTMwOTgyMzc3MzQiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiI1MTk2MzA1NDIyNTI1NjUwODY5IiwiaW1hZ2VEb2NpZCI6Ijc1NzU5ODQ1NTMzNzk4MTQ1NjQiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI4NjM2MTgyODE1MjM2OTQyMjkxIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTIzODgxNTkxNTMwOTgyMzc3MzQiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiI1MTk2MzA1NDIyNTI1NjUwODY5IiwiaW1hZ2VEb2NpZCI6Ijc1NzU5ODQ1NTMzNzk4MTQ1NjQiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI4NjM2MTgyODE1MjM2OTQyMjkxIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //           source: "Uniqlo",
    //           source_icon:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f050280b0171e97b0e2de0cc591efa5458b94c35ba771f7a757290e7c2d10bc77bc7092b3724fc4b2315.png",
    //           price: "$49.90",
    //           extracted_price: 49.9,
    //           rating: null,
    //           thumbnail:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f050280b0171e97b0e2de0cc591efa5458b94c35ba771f7a7572cb6b0cbb66ddccd18ec5b9497583adab.webp",
    //           delivery: "Free delivery on $99+",
    //         },
    //         {
    //           position: 4,
    //           title: "UNIQLO Men's Pleated Wide Brushed Twill Pants",
    //           product_id: "13716378216618665062",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=13716378216618665062",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:13716378216618665062,headlineOfferDocid:14492387211800446279,imageDocid:15565683085076879053,rds:PC_6145078773191752237|PROD_PC_6145078773191752237,gpcid:6664702460424391224,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTM3MTYzNzgyMTY2MTg2NjUwNjIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNDQ5MjM4NzIxMTgwMDQ0NjI3OSIsImltYWdlRG9jaWQiOiIxNTU2NTY4MzA4NTA3Njg3OTA1MyIsInJkcyI6IlBDXzYxNDUwNzg3NzMxOTE3NTIyMzd8UFJPRF9QQ182MTQ1MDc4NzczMTkxNzUyMjM3IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiNjY2NDcwMjQ2MDQyNDM5MTIyNCIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTM3MTYzNzgyMTY2MTg2NjUwNjIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNDQ5MjM4NzIxMTgwMDQ0NjI3OSIsImltYWdlRG9jaWQiOiIxNTU2NTY4MzA4NTA3Njg3OTA1MyIsInJkcyI6IlBDXzYxNDUwNzg3NzMxOTE3NTIyMzd8UFJPRF9QQ182MTQ1MDc4NzczMTkxNzUyMjM3IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiNjY2NDcwMjQ2MDQyNDM5MTIyNCIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //           source: "Uniqlo",
    //           source_icon:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f050280b0171e97b0e2de0cc591efa5458b94c35ba771f7a7572b8135bacbc377e636d126929cad14d64.png",
    //           multiple_sources: true,
    //           price: "$49.90",
    //           extracted_price: 49.9,
    //           rating: 5,
    //           reviews: 1,
    //           thumbnail:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f050280b0171e97b0e2de0cc591efa5458b94c35ba771f7a7572137345690ecadafe077729a3cf2e0f38.webp",
    //           delivery: "Free delivery on $99+",
    //         },
    //         {
    //           position: 5,
    //           title: "UNIQLO Men's Pleated Wide Tweed Pants",
    //           product_id: "13501069312706595287",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=13501069312706595287",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:13501069312706595287,headlineOfferDocid:1080605973967575032,imageDocid:7252659062843790338,rds:PC_6145078773191752237|PROD_PC_6145078773191752237,gpcid:2019237282848385776,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTM1MDEwNjkzMTI3MDY1OTUyODciLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxMDgwNjA1OTczOTY3NTc1MDMyIiwiaW1hZ2VEb2NpZCI6IjcyNTI2NTkwNjI4NDM3OTAzMzgiLCJyZHMiOiJQQ182MTQ1MDc4NzczMTkxNzUyMjM3fFBST0RfUENfNjE0NTA3ODc3MzE5MTc1MjIzNyIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IjIwMTkyMzcyODI4NDgzODU3NzYiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ==",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTM1MDEwNjkzMTI3MDY1OTUyODciLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxMDgwNjA1OTczOTY3NTc1MDMyIiwiaW1hZ2VEb2NpZCI6IjcyNTI2NTkwNjI4NDM3OTAzMzgiLCJyZHMiOiJQQ182MTQ1MDc4NzczMTkxNzUyMjM3fFBST0RfUENfNjE0NTA3ODc3MzE5MTc1MjIzNyIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IjIwMTkyMzcyODI4NDgzODU3NzYiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ%3D%3D",
    //           source: "Uniqlo",
    //           source_icon:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f050280b0171e97b0e2de0cc591efa5458b94c35ba771f7a75725858fd7109330aa5f5e9a28352912895.png",
    //           multiple_sources: true,
    //           price: "$49.90",
    //           extracted_price: 49.9,
    //           rating: 5,
    //           reviews: 1,
    //           thumbnail:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f050280b0171e97b0e2de0cc591efa5458b94c35ba771f7a75729a5a08c06cdf934d61734b15dff7a524.webp",
    //           delivery: "Free delivery on $99+",
    //         },
    //         {
    //           position: 6,
    //           title: "Uniqlo Pleated Wide Leg Baggy Khaki Dress",
    //           product_id: "6737344302087545734",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=6737344302087545734",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=productid:6737344302087545734,headlineOfferDocid:6737344302087545734,imageDocid:7758458699223895441,rds:PC_3183198369991433542|PROD_PC_3183198369991433542,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiNjczNzM0NDMwMjA4NzU0NTczNCIsImNhdGFsb2dpZCI6IiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjY3MzczNDQzMDIwODc1NDU3MzQiLCJpbWFnZURvY2lkIjoiNzc1ODQ1ODY5OTIyMzg5NTQ0MSIsInJkcyI6IlBDXzMxODMxOTgzNjk5OTE0MzM1NDJ8UFJPRF9QQ18zMTgzMTk4MzY5OTkxNDMzNTQyIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiNjczNzM0NDMwMjA4NzU0NTczNCIsImNhdGFsb2dpZCI6IiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjY3MzczNDQzMDIwODc1NDU3MzQiLCJpbWFnZURvY2lkIjoiNzc1ODQ1ODY5OTIyMzg5NTQ0MSIsInJkcyI6IlBDXzMxODMxOTgzNjk5OTE0MzM1NDJ8UFJPRF9QQ18zMTgzMTk4MzY5OTkxNDMzNTQyIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //           source: "eBay",
    //           source_icon:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f050280b0171e97b0e2de0cc591efa5458b94c35ba771f7a7572fc74d4a8b282c37d2c9336043078b3f5.png",
    //           price: "$40.00",
    //           extracted_price: 40,
    //           rating: 5,
    //           reviews: 1,
    //           thumbnail:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f050280b0171e97b0e2de0cc591efa5458b94c35ba771f7a75726f7bf2215ce54861d21eda14caca1659.webp",
    //         },
    //         {
    //           position: 7,
    //           title: "Uniqlo Pleated Wide Trousers",
    //           product_id: "2620124638902094211",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=2620124638902094211",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=productid:2620124638902094211,headlineOfferDocid:2620124638902094211,imageDocid:11545268970034070356,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMjYyMDEyNDYzODkwMjA5NDIxMSIsImNhdGFsb2dpZCI6IiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjI2MjAxMjQ2Mzg5MDIwOTQyMTEiLCJpbWFnZURvY2lkIjoiMTE1NDUyNjg5NzAwMzQwNzAzNTYiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ==",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMjYyMDEyNDYzODkwMjA5NDIxMSIsImNhdGFsb2dpZCI6IiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjI2MjAxMjQ2Mzg5MDIwOTQyMTEiLCJpbWFnZURvY2lkIjoiMTE1NDUyNjg5NzAwMzQwNzAzNTYiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ%3D%3D",
    //           source: "Poshmark",
    //           source_icon:
    //             "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcQgE5YW9q7ce-TY-ORlvWjWfhcq61HU1-cph5DDKWEFIARUAQSdI7Q7a_t3VW7jGLqcgcFb_1KWHtfMCXQ2pUUEd_NU0jU",
    //           price: "$30.00",
    //           extracted_price: 30,
    //           second_hand_condition: "pre-owned",
    //           rating: null,
    //           thumbnail:
    //             "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcTuUyyrSaoE6m-uyYaVnmMVBO9ixX9Gsi5u-36SVU5cA2XH0NS_FCg6OJGXenzRUWaNzdrdJFI_df9EAu6IrfxXqkVuxl82k-PcQ2pAEL-R",
    //           serpapi_thumbnail:
    //             "https://serpapi.com/images/url/vMK_VXicDcltCoIwAADQE03FUFKIsFBTSktz2S-xzY9hzuk2UI_TrbpNvb_v-2mFYNxW1YqiaWGiwkC8qKY0XJSCIAUNvcrbgTFCm_24-5_tRNjy0V1myzKl5eCaPZDLs4S0v8BDbJE5t3xODAk2ZgozAzl6ftKitPCOjRmHfl7RNckeZbTiCYdeUODach1pBlM952MH5fze6h24opvOHPcMkh9guTmz",
    //           tag: "40% OFF",
    //           extensions: ["40% OFF"],
    //         },
    //         {
    //           position: 8,
    //           title: "Uniqlo Pleated Dress Pant",
    //           product_id: "17456619856103664466",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=17456619856103664466",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=productid:17456619856103664466,headlineOfferDocid:17456619856103664466,imageDocid:7370784450495167903,rds:PC_384375334012251989|PROD_PC_384375334012251989,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMTc0NTY2MTk4NTYxMDM2NjQ0NjYiLCJjYXRhbG9naWQiOiIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNzQ1NjYxOTg1NjEwMzY2NDQ2NiIsImltYWdlRG9jaWQiOiI3MzcwNzg0NDUwNDk1MTY3OTAzIiwicmRzIjoiUENfMzg0Mzc1MzM0MDEyMjUxOTg5fFBST0RfUENfMzg0Mzc1MzM0MDEyMjUxOTg5IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMTc0NTY2MTk4NTYxMDM2NjQ0NjYiLCJjYXRhbG9naWQiOiIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNzQ1NjYxOTg1NjEwMzY2NDQ2NiIsImltYWdlRG9jaWQiOiI3MzcwNzg0NDUwNDk1MTY3OTAzIiwicmRzIjoiUENfMzg0Mzc1MzM0MDEyMjUxOTg5fFBST0RfUENfMzg0Mzc1MzM0MDEyMjUxOTg5IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //           source: "eBay",
    //           source_icon:
    //             "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcSN1XmQeJU_yT0zcxhHYWuffZKmEBeCLcmLdkaZM422mZbdDohDeZ1F0htTlz68NMC5ys71nX8kDNtoHo_3z5uYipJX7A",
    //           price: "$39.00",
    //           extracted_price: 39,
    //           second_hand_condition: "pre-owned",
    //           rating: 5,
    //           reviews: 1,
    //           thumbnail:
    //             "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcSGwpZHW4h4pLjwvLlLZvp4-UdkarJ9WZRxrDSthQYuqU2Wa8z7GawsQupzMddyRZWoKPN3dHImJrQ11hH3xkA2jS8FCV5LIO2NhNfPRJOQ",
    //           serpapi_thumbnail:
    //             "https://serpapi.com/images/url/QW3gXnicDcnbEkJAAADQL8K4NGGmaUxNLgnLaCdv2pVFWKzr5_RX_U2d1_P9EMbooAtC1qB-pSzDHHs2Mp8PLGUF4lFbCwNpKS2a_Ngd_qcbHtZMFJkzTSyoEIW65Ty5bzeZqMLFuEp7R4NJuPTniBHwGLtYgqm67c10HsBItxvGa5jA9hp4Mrbs2umBKBJLXipDKiP1crrvXNuXPOK9gtDxwQ-ZuDos",
    //           delivery: "Free delivery",
    //         },
    //       ],
    //     },
    //     {
    //       title: "Straight-leg Uniqlo pleated trousers",
    //       shopping_results: [
    //         {
    //           position: 1,
    //           title: "UNIQLO Men's Pleated Wide Pants",
    //           product_id: "6266015511773730422",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=6266015511773730422",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:6266015511773730422,headlineOfferDocid:15291530500428677282,imageDocid:6267610566977729456,gpcid:6145078773191752237,mid:576462511164041558,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiNjI2NjAxNTUxMTc3MzczMDQyMiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjE1MjkxNTMwNTAwNDI4Njc3MjgyIiwiaW1hZ2VEb2NpZCI6IjYyNjc2MTA1NjY5Nzc3Mjk0NTYiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI2MTQ1MDc4NzczMTkxNzUyMjM3IiwibWlkIjoiNTc2NDYyNTExMTY0MDQxNTU4IiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiNjI2NjAxNTUxMTc3MzczMDQyMiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjE1MjkxNTMwNTAwNDI4Njc3MjgyIiwiaW1hZ2VEb2NpZCI6IjYyNjc2MTA1NjY5Nzc3Mjk0NTYiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI2MTQ1MDc4NzczMTkxNzUyMjM3IiwibWlkIjoiNTc2NDYyNTExMTY0MDQxNTU4IiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //           source: "Uniqlo",
    //           source_icon:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f05023e25930f6cacbf8f4c5f7f2d51a735b61085309a53b838b63da747dcdd9b4a753b69a571deac98f.png",
    //           multiple_sources: true,
    //           price: "$49.90",
    //           extracted_price: 49.9,
    //           rating: null,
    //           thumbnail:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f05023e25930f6cacbf8f4c5f7f2d51a735b61085309a53b838ba05ae88bad8a73a49a47e477ba9ac141.webp",
    //           delivery: "Free delivery on $99+",
    //         },
    //         {
    //           position: 2,
    //           title: "UNIQLO Pleated Wide Brushed Jersey Trousers",
    //           product_id: "12824397898205488817",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=12824397898205488817",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:12824397898205488817,headlineOfferDocid:17038324915319025940,imageDocid:6225355268328441500,gpcid:9375764651562891955,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTI4MjQzOTc4OTgyMDU0ODg4MTciLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNzAzODMyNDkxNTMxOTAyNTk0MCIsImltYWdlRG9jaWQiOiI2MjI1MzU1MjY4MzI4NDQxNTAwIiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiOTM3NTc2NDY1MTU2Mjg5MTk1NSIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTI4MjQzOTc4OTgyMDU0ODg4MTciLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNzAzODMyNDkxNTMxOTAyNTk0MCIsImltYWdlRG9jaWQiOiI2MjI1MzU1MjY4MzI4NDQxNTAwIiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiOTM3NTc2NDY1MTU2Mjg5MTk1NSIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //           source: "Uniqlo",
    //           source_icon:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f05023e25930f6cacbf8f4c5f7f2d51a735b61085309a53b838b9a727f67052ee8f504c86a94e7384d3e.png",
    //           price: "$49.90",
    //           extracted_price: 49.9,
    //           rating: null,
    //           thumbnail:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f05023e25930f6cacbf8f4c5f7f2d51a735b61085309a53b838bd1e00309da4c74ff0136984c8e03a7c3.webp",
    //           delivery: "Free delivery on $99+",
    //         },
    //         {
    //           position: 3,
    //           title: "UNIQLO Pleated Wide Trousers",
    //           product_id: "12388159153098237734",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=12388159153098237734",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:12388159153098237734,headlineOfferDocid:5196305422525650869,imageDocid:7575984553379814564,gpcid:8636182815236942291,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTIzODgxNTkxNTMwOTgyMzc3MzQiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiI1MTk2MzA1NDIyNTI1NjUwODY5IiwiaW1hZ2VEb2NpZCI6Ijc1NzU5ODQ1NTMzNzk4MTQ1NjQiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI4NjM2MTgyODE1MjM2OTQyMjkxIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTIzODgxNTkxNTMwOTgyMzc3MzQiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiI1MTk2MzA1NDIyNTI1NjUwODY5IiwiaW1hZ2VEb2NpZCI6Ijc1NzU5ODQ1NTMzNzk4MTQ1NjQiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI4NjM2MTgyODE1MjM2OTQyMjkxIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //           source: "Uniqlo",
    //           source_icon:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f05023e25930f6cacbf8f4c5f7f2d51a735b61085309a53b838bacdcbbd84afc9780cbc5e8b63760838d.png",
    //           price: "$49.90",
    //           extracted_price: 49.9,
    //           rating: null,
    //           thumbnail:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f05023e25930f6cacbf8f4c5f7f2d51a735b61085309a53b838bd7fb9f3d2d96e96f73056a13b34d2c9e.webp",
    //           delivery: "Free delivery on $99+",
    //         },
    //         {
    //           position: 4,
    //           title: "UNIQLO Men's Pleated Wide Brushed Twill Pants",
    //           product_id: "13716378216618665062",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=13716378216618665062",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:13716378216618665062,headlineOfferDocid:14492387211800446279,imageDocid:15565683085076879053,rds:PC_6145078773191752237|PROD_PC_6145078773191752237,gpcid:6664702460424391224,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTM3MTYzNzgyMTY2MTg2NjUwNjIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNDQ5MjM4NzIxMTgwMDQ0NjI3OSIsImltYWdlRG9jaWQiOiIxNTU2NTY4MzA4NTA3Njg3OTA1MyIsInJkcyI6IlBDXzYxNDUwNzg3NzMxOTE3NTIyMzd8UFJPRF9QQ182MTQ1MDc4NzczMTkxNzUyMjM3IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiNjY2NDcwMjQ2MDQyNDM5MTIyNCIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTM3MTYzNzgyMTY2MTg2NjUwNjIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNDQ5MjM4NzIxMTgwMDQ0NjI3OSIsImltYWdlRG9jaWQiOiIxNTU2NTY4MzA4NTA3Njg3OTA1MyIsInJkcyI6IlBDXzYxNDUwNzg3NzMxOTE3NTIyMzd8UFJPRF9QQ182MTQ1MDc4NzczMTkxNzUyMjM3IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiNjY2NDcwMjQ2MDQyNDM5MTIyNCIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //           source: "Uniqlo",
    //           source_icon:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f05023e25930f6cacbf8f4c5f7f2d51a735b61085309a53b838b17b41413d19f4e2d46a1f2fae0ca18e6.png",
    //           multiple_sources: true,
    //           price: "$49.90",
    //           extracted_price: 49.9,
    //           rating: 5,
    //           reviews: 1,
    //           thumbnail:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f05023e25930f6cacbf8f4c5f7f2d51a735b61085309a53b838b6f86b06991fe0fa795f9fa1b978c86e3.webp",
    //           delivery: "Free delivery on $99+",
    //         },
    //         {
    //           position: 5,
    //           title: "UNIQLO Men's Pleated Wide Tweed Pants",
    //           product_id: "13501069312706595287",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=13501069312706595287",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:13501069312706595287,headlineOfferDocid:5876014906090041311,imageDocid:7252659062843790338,rds:PC_6145078773191752237|PROD_PC_6145078773191752237,gpcid:2019237282848385776,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTM1MDEwNjkzMTI3MDY1OTUyODciLCJoZWFkbGluZU9mZmVyRG9jaWQiOiI1ODc2MDE0OTA2MDkwMDQxMzExIiwiaW1hZ2VEb2NpZCI6IjcyNTI2NTkwNjI4NDM3OTAzMzgiLCJyZHMiOiJQQ182MTQ1MDc4NzczMTkxNzUyMjM3fFBST0RfUENfNjE0NTA3ODc3MzE5MTc1MjIzNyIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IjIwMTkyMzcyODI4NDgzODU3NzYiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ==",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTM1MDEwNjkzMTI3MDY1OTUyODciLCJoZWFkbGluZU9mZmVyRG9jaWQiOiI1ODc2MDE0OTA2MDkwMDQxMzExIiwiaW1hZ2VEb2NpZCI6IjcyNTI2NTkwNjI4NDM3OTAzMzgiLCJyZHMiOiJQQ182MTQ1MDc4NzczMTkxNzUyMjM3fFBST0RfUENfNjE0NTA3ODc3MzE5MTc1MjIzNyIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IjIwMTkyMzcyODI4NDgzODU3NzYiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ%3D%3D",
    //           source: "Uniqlo",
    //           source_icon:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f05023e25930f6cacbf8f4c5f7f2d51a735b61085309a53b838bcb832bf8c39bbffa5beafa04db924dad.png",
    //           multiple_sources: true,
    //           price: "$49.90",
    //           extracted_price: 49.9,
    //           rating: 5,
    //           reviews: 1,
    //           thumbnail:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f05023e25930f6cacbf8f4c5f7f2d51a735b61085309a53b838bfd193fe591e3c53dfa82bd6caac3b37f.webp",
    //           delivery: "Free delivery on $99+",
    //         },
    //         {
    //           position: 6,
    //           title: "Uniqlo Pleated Dress Pant",
    //           product_id: "17456619856103664466",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=17456619856103664466",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=productid:17456619856103664466,headlineOfferDocid:17456619856103664466,imageDocid:7370784450495167903,rds:PC_384375334012251989|PROD_PC_384375334012251989,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMTc0NTY2MTk4NTYxMDM2NjQ0NjYiLCJjYXRhbG9naWQiOiIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNzQ1NjYxOTg1NjEwMzY2NDQ2NiIsImltYWdlRG9jaWQiOiI3MzcwNzg0NDUwNDk1MTY3OTAzIiwicmRzIjoiUENfMzg0Mzc1MzM0MDEyMjUxOTg5fFBST0RfUENfMzg0Mzc1MzM0MDEyMjUxOTg5IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMTc0NTY2MTk4NTYxMDM2NjQ0NjYiLCJjYXRhbG9naWQiOiIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNzQ1NjYxOTg1NjEwMzY2NDQ2NiIsImltYWdlRG9jaWQiOiI3MzcwNzg0NDUwNDk1MTY3OTAzIiwicmRzIjoiUENfMzg0Mzc1MzM0MDEyMjUxOTg5fFBST0RfUENfMzg0Mzc1MzM0MDEyMjUxOTg5IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //           source: "eBay",
    //           source_icon:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f05023e25930f6cacbf8f4c5f7f2d51a735b61085309a53b838bf539b4eef6ba7e0a904133dcf0ff0ae3.png",
    //           price: "$39.00",
    //           extracted_price: 39,
    //           second_hand_condition: "pre-owned",
    //           rating: 5,
    //           reviews: 1,
    //           thumbnail:
    //             "https://serpapi.com/searches/68f3ef1aeb2bd1bee75ce504/images/47bf68ee32df47770c98a1933b672ec95144f8bdf9c5f05023e25930f6cacbf8f4c5f7f2d51a735b61085309a53b838b6c0cbdc0ace690e8248057df0f479f66.webp",
    //           delivery: "Free delivery",
    //         },
    //         {
    //           position: 7,
    //           title: "Uniqlo Pleated Trousers",
    //           product_id: "70762897927534420",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=70762897927534420",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=productid:70762897927534420,headlineOfferDocid:70762897927534420,imageDocid:5748345454168261066,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiNzA3NjI4OTc5Mjc1MzQ0MjAiLCJjYXRhbG9naWQiOiIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiI3MDc2Mjg5NzkyNzUzNDQyMCIsImltYWdlRG9jaWQiOiI1NzQ4MzQ1NDU0MTY4MjYxMDY2IiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiNzA3NjI4OTc5Mjc1MzQ0MjAiLCJjYXRhbG9naWQiOiIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiI3MDc2Mjg5NzkyNzUzNDQyMCIsImltYWdlRG9jaWQiOiI1NzQ4MzQ1NDU0MTY4MjYxMDY2IiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //           source: "Poshmark",
    //           source_icon:
    //             "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcQgE5YW9q7ce-TY-ORlvWjWfhcq61HU1-cph5DDKWEFIARUAQSdI7Q7a_t3VW7jGLqcgcFb_1KWHtfMCXQ2pUUEd_NU0jU",
    //           price: "$20.00",
    //           extracted_price: 20,
    //           second_hand_condition: "pre-owned",
    //           rating: null,
    //           thumbnail:
    //             "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcRYD81lDWpV97qhNSDfyd-6QD7GIP5jR7i9ElY6uwnoYYmtNnC9wuERENVu9RFzU-6Iob-XPwOmS-pjBrWm3nDIaeS3eqNyDdb7w38GANe-muZnWlPDub1ZjQ",
    //           serpapi_thumbnail:
    //             "https://serpapi.com/images/url/zaBUqXicDclJDoIwAADAFxWCRKAkxqBFwqWyRLDcWCpLaCnQhuCr_I6_0bnO99NJKVZX1ymvl11I2gBZ8YPWrrKUfa3VE9PXbhKi5-15Pv3P9XADgzohyDFGlIsM2nOHU_TaG2DFyA7C6Dgkdg_9kVhq4xMhTGJ-hZvyEx9nCia39wNY4VSBZ7TdWQrEcFlyZnIUljQ16Yx31FT2ZjqBhylgquD5GCFVGcUQ_wBasT4D",
    //         },
    //         {
    //           position: 8,
    //           title: "Uniqlo Women's Pleated Straight Pants",
    //           product_id: "4461110383957598715",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=4461110383957598715",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=productid:4461110383957598715,headlineOfferDocid:4461110383957598715,imageDocid:10603584145358483804,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiNDQ2MTExMDM4Mzk1NzU5ODcxNSIsImNhdGFsb2dpZCI6IiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjQ0NjExMTAzODM5NTc1OTg3MTUiLCJpbWFnZURvY2lkIjoiMTA2MDM1ODQxNDUzNTg0ODM4MDQiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ==",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiNDQ2MTExMDM4Mzk1NzU5ODcxNSIsImNhdGFsb2dpZCI6IiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjQ0NjExMTAzODM5NTc1OTg3MTUiLCJpbWFnZURvY2lkIjoiMTA2MDM1ODQxNDUzNTg0ODM4MDQiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ%3D%3D",
    //           source: "eBay - whickeddeals",
    //           source_icon:
    //             "https://encrypted-tbn1.gstatic.com/favicon-tbn?q=tbn%3AANd9GcRR0_zHnaJ3qErUF0QmVnyDMkZsagL2saaoEuixfD9kcC3BfifYr-i6Mb1745RdfmGPuusArl4AC2obvdP1BwJRoInAlVM",
    //           price: "$37.99",
    //           extracted_price: 37.99,
    //           second_hand_condition: "pre-owned",
    //           rating: null,
    //           thumbnail:
    //             "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSWT8xpOWw8YM_07wNXspczqdP42yurQ4i24v7XpAYYYFD7_XXOqGpfCiNmKfWlk1IdJ4elEA4XP7La76GFQvWAeVjQ942yqsbxxmfBQ5ZFU-Ajw9YnIjBTZw",
    //           serpapi_thumbnail:
    //             "https://serpapi.com/images/url/kdNs33icDczbEkJAAADQLwqZrcVM02wXppuYLna9GBahsOyG-qp-p7-p5zNzvp9MCMYNWU4q2r6YSOKRiCpFunERipxKtC5lntWM5dVt3sz-ZiA71i168s7awI5er5FDoMDexpzRdxM7QH09WxfkKuggZogQYq5ggPGxsVi6zO1yl3qP-3gTb0HyWCOAHbgP4dQy3c5DybVw9f_Q8GgYynThTnzzMkJFr5NqUyzOfv8DnqY-Xg",
    //           delivery: "Free delivery",
    //         },
    //       ],
    //     },
    //     {
    //       title: "Men's Uniqlo pleated trousers",
    //       shopping_results: [
    //         {
    //           position: 1,
    //           title: "UNIQLO Men's Pleated Wide Pants",
    //           product_id: "6266015511773730422",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=6266015511773730422",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:6266015511773730422,headlineOfferDocid:17999028462967131449,imageDocid:6267610566977729456,gpcid:6145078773191752237,mid:576462511164041558,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiNjI2NjAxNTUxMTc3MzczMDQyMiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjE3OTk5MDI4NDYyOTY3MTMxNDQ5IiwiaW1hZ2VEb2NpZCI6IjYyNjc2MTA1NjY5Nzc3Mjk0NTYiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI2MTQ1MDc4NzczMTkxNzUyMjM3IiwibWlkIjoiNTc2NDYyNTExMTY0MDQxNTU4IiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiNjI2NjAxNTUxMTc3MzczMDQyMiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjE3OTk5MDI4NDYyOTY3MTMxNDQ5IiwiaW1hZ2VEb2NpZCI6IjYyNjc2MTA1NjY5Nzc3Mjk0NTYiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI2MTQ1MDc4NzczMTkxNzUyMjM3IiwibWlkIjoiNTc2NDYyNTExMTY0MDQxNTU4IiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //           source: "Uniqlo",
    //           source_icon:
    //             "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcSIeGkqa_kLTVTNyArc66HNnsOSdtKhl2aZWkdvbZK2dNO3aDtdhgnkxYbvak3yBel2AkvRjLIqaeuToJkkih0J8TbSZ7HA3w",
    //           multiple_sources: true,
    //           price: "$49.90",
    //           extracted_price: 49.9,
    //           rating: null,
    //           thumbnail:
    //             "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcTZAYdzpp7CuZeCFjmiMQ3bDauEVlrb4ISwcWcFr9x0lYeCI7F4qW0Lt0ztxwpzs2VhO148PD02Syl0jCcIAghj6IlCThVN-qxVTQ58ttOt3F0G57fIh5gp",
    //           serpapi_thumbnail:
    //             "https://serpapi.com/images/url/ZgkbYnicDcndCoIwGADQJ1KXaZoQIbPJoD9JJnWncznFn6lfpD5U79Pb1Lk9348EUKNnGKLlw6xA5BpkLdKLEVIouc67xhhlp1TZFvt-9z_PP-fbkMcP_54vSjn49RCYVE15itZZkL4OrB4yi97ePOFk2E6ovgtMHWL1CToCWmB6q2U0mbysLPcaIPM216jCnPqFrDa0xrFkZ62fWBzZLsAF1gSFtvOk0i7UDz7gPZI",
    //           delivery: "Free delivery on $99+",
    //         },
    //         {
    //           position: 2,
    //           title: "UNIQLO Men's Pleated Wide Brushed Twill Pants",
    //           product_id: "13716378216618665062",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=13716378216618665062",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:13716378216618665062,headlineOfferDocid:13804169429816865495,imageDocid:15565683085076879053,rds:PC_6145078773191752237|PROD_PC_6145078773191752237,gpcid:6664702460424391224,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTM3MTYzNzgyMTY2MTg2NjUwNjIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxMzgwNDE2OTQyOTgxNjg2NTQ5NSIsImltYWdlRG9jaWQiOiIxNTU2NTY4MzA4NTA3Njg3OTA1MyIsInJkcyI6IlBDXzYxNDUwNzg3NzMxOTE3NTIyMzd8UFJPRF9QQ182MTQ1MDc4NzczMTkxNzUyMjM3IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiNjY2NDcwMjQ2MDQyNDM5MTIyNCIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTM3MTYzNzgyMTY2MTg2NjUwNjIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxMzgwNDE2OTQyOTgxNjg2NTQ5NSIsImltYWdlRG9jaWQiOiIxNTU2NTY4MzA4NTA3Njg3OTA1MyIsInJkcyI6IlBDXzYxNDUwNzg3NzMxOTE3NTIyMzd8UFJPRF9QQ182MTQ1MDc4NzczMTkxNzUyMjM3IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiNjY2NDcwMjQ2MDQyNDM5MTIyNCIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //           source: "Uniqlo",
    //           source_icon:
    //             "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcSIeGkqa_kLTVTNyArc66HNnsOSdtKhl2aZWkdvbZK2dNO3aDtdhgnkxYbvak3yBel2AkvRjLIqaeuToJkkih0J8TbSZ7HA3w",
    //           multiple_sources: true,
    //           price: "$49.90",
    //           extracted_price: 49.9,
    //           rating: 5,
    //           reviews: 1,
    //           thumbnail:
    //             "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcRngGkuiRcSZN9M39MlDsy71TcAmWZZrGtMrhAXLy5BbqF9xU_hJbesdxY6f3-NH86JkMdm6v3j7Jnp6xUB8wCCG8b2aIq5RgwO7xm1k77GDZpla7xWMbgHSQ",
    //           serpapi_thumbnail:
    //             "https://serpapi.com/images/url/4dHDh3icDcltDoIgAADQE5kzp6hba34syoUtrVX-aYKGphIKFd6q63Sben_f91NLyYWn6xUj48RlVWoSM2NGhSxkQ2bk0euifnDeMLocFv_z_KR0IUkZhe2zSUmWJy4yXdRFYgLGgfj9Kc9HKNFY--ftZAV4WLnqeK1jXIlSXeybqSVrx45bVPb2y7yDmHFbHQPnHYbQwfNiM1gpfe-A6o0WABjlvCuAOiFM19n-B6D5PjA",
    //           delivery: "Free delivery on $99+",
    //         },
    //         {
    //           position: 3,
    //           title: "UNIQLO Pleated Wide Trousers",
    //           product_id: "12388159153098237734",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=12388159153098237734",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:12388159153098237734,headlineOfferDocid:5196305422525650869,imageDocid:7575984553379814564,gpcid:8636182815236942291,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTIzODgxNTkxNTMwOTgyMzc3MzQiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiI1MTk2MzA1NDIyNTI1NjUwODY5IiwiaW1hZ2VEb2NpZCI6Ijc1NzU5ODQ1NTMzNzk4MTQ1NjQiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI4NjM2MTgyODE1MjM2OTQyMjkxIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTIzODgxNTkxNTMwOTgyMzc3MzQiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiI1MTk2MzA1NDIyNTI1NjUwODY5IiwiaW1hZ2VEb2NpZCI6Ijc1NzU5ODQ1NTMzNzk4MTQ1NjQiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiI4NjM2MTgyODE1MjM2OTQyMjkxIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //           source: "Uniqlo",
    //           source_icon:
    //             "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcSIeGkqa_kLTVTNyArc66HNnsOSdtKhl2aZWkdvbZK2dNO3aDtdhgnkxYbvak3yBel2AkvRjLIqaeuToJkkih0J8TbSZ7HA3w",
    //           price: "$49.90",
    //           extracted_price: 49.9,
    //           rating: null,
    //           thumbnail:
    //             "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSg-p8gAqTcquvT_GOlJYMtsEB4xZeMJE1hqLeceuUM6WXHeMhl4igAORD8xhai4mUcqLnbv7hZfI7Xy59cH6IdQrXF7ppIKoa63g71AOQU6XPHbC7sKcUBXQ",
    //           serpapi_thumbnail:
    //             "https://serpapi.com/images/url/iQQBv3icDcnxDoFAHADgJ1KadGozK6JSEm6Of6x-nbu21J07xlt5HW_D9-_3_XCthfJMk3ZwfwtN64GuuqHBlC51Awb0N1PxXoimYzM5_Z_nb2p3BXs2EBPmywPIx_NwWeVtcsq0CgP7daZZElpcphToA2fOkUQ0463dMD_fLSYvXjb2DYNMu-qJ-PkaI_IeuxA5cV3cyRIJEa_70hkxZPl5gR2yjao5UmvAASl-yWE-SQ",
    //           delivery: "Free delivery on $99+",
    //         },
    //         {
    //           position: 4,
    //           title: "UNIQLO Men's Pleated Wide Tweed Pants",
    //           product_id: "13501069312706595287",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=13501069312706595287",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:13501069312706595287,headlineOfferDocid:5876014906090041311,imageDocid:7252659062843790338,rds:PC_6145078773191752237|PROD_PC_6145078773191752237,gpcid:2019237282848385776,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTM1MDEwNjkzMTI3MDY1OTUyODciLCJoZWFkbGluZU9mZmVyRG9jaWQiOiI1ODc2MDE0OTA2MDkwMDQxMzExIiwiaW1hZ2VEb2NpZCI6IjcyNTI2NTkwNjI4NDM3OTAzMzgiLCJyZHMiOiJQQ182MTQ1MDc4NzczMTkxNzUyMjM3fFBST0RfUENfNjE0NTA3ODc3MzE5MTc1MjIzNyIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IjIwMTkyMzcyODI4NDgzODU3NzYiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ==",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiMTM1MDEwNjkzMTI3MDY1OTUyODciLCJoZWFkbGluZU9mZmVyRG9jaWQiOiI1ODc2MDE0OTA2MDkwMDQxMzExIiwiaW1hZ2VEb2NpZCI6IjcyNTI2NTkwNjI4NDM3OTAzMzgiLCJyZHMiOiJQQ182MTQ1MDc4NzczMTkxNzUyMjM3fFBST0RfUENfNjE0NTA3ODc3MzE5MTc1MjIzNyIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IjIwMTkyMzcyODI4NDgzODU3NzYiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ%3D%3D",
    //           source: "Uniqlo",
    //           source_icon:
    //             "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcSIeGkqa_kLTVTNyArc66HNnsOSdtKhl2aZWkdvbZK2dNO3aDtdhgnkxYbvak3yBel2AkvRjLIqaeuToJkkih0J8TbSZ7HA3w",
    //           multiple_sources: true,
    //           price: "$49.90",
    //           extracted_price: 49.9,
    //           rating: 5,
    //           reviews: 1,
    //           thumbnail:
    //             "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcS_2B-TC67UZGQT0uXIhk3rshp2DuOTctPcHRik0lRhBEHYLC1xCtKn1xG2IWpRx8qBPDyc8klM5E9PdS6K1NOFxSJD4Td1_yaHQTFggbFtlQePWr8Uo5x0en8",
    //           serpapi_thumbnail:
    //             "https://serpapi.com/images/url/8hzcTHicDclJDoIwFADQE8mkIpgYIyCDKDKUOGwIFkIJWAp8knIsj-Nt9G3f90MA2LgVxZLiYWZQFgt4UUWoRsihxgLu3uJIOsZqWu373f-2h6DQHZxkirFAprpJn06EpOnukWY5jIQp1nRFGELsxnUjtTExju7jbMrcBJ_K3FG8G4u51huhNWOtaS_rox4WierLwdXmyclaoULO5tyNkF1VLxvaqAxvg5Z2ay6VVPsBfmk9vQ",
    //           delivery: "Free delivery on $99+",
    //         },
    //         {
    //           position: 5,
    //           title: "Uniqlo Men's Double Pleated Wide Leg Pants",
    //           product_id: "16781972866473632848",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=16781972866473632848",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=productid:16781972866473632848,headlineOfferDocid:16781972866473632848,imageDocid:10615586728726659093,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMTY3ODE5NzI4NjY0NzM2MzI4NDgiLCJjYXRhbG9naWQiOiIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNjc4MTk3Mjg2NjQ3MzYzMjg0OCIsImltYWdlRG9jaWQiOiIxMDYxNTU4NjcyODcyNjY1OTA5MyIsInJkcyI6IiIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IiIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMTY3ODE5NzI4NjY0NzM2MzI4NDgiLCJjYXRhbG9naWQiOiIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNjc4MTk3Mjg2NjQ3MzYzMjg0OCIsImltYWdlRG9jaWQiOiIxMDYxNTU4NjcyODcyNjY1OTA5MyIsInJkcyI6IiIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IiIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //           source: "eBay",
    //           source_icon:
    //             "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcSN1XmQeJU_yT0zcxhHYWuffZKmEBeCLcmLdkaZM422mZbdDohDeZ1F0htTlz68NMC5ys71nX8kDNtoHo_3z5uYipJX7A",
    //           price: "$49.00",
    //           extracted_price: 49,
    //           rating: null,
    //           thumbnail:
    //             "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcSj84fgg---C3vS1q2hPaLEYuddjAai8EUiakd_cZnzmnpz3rfUxMYomrcQ3zHYcOllW0UI3UBxYUVyfpwTQhHQqtEGjGVZat6_a_JSf2TVFXyMxkUQ5y0s",
    //           serpapi_thumbnail:
    //             "https://serpapi.com/images/url/ThSFfHicDclJDoIwAADAF5VF1CCJMWgQNKISKAoXUlt2KAWqAo_yP_5G5zrfT8Y56zVRjCnuRsZjAviDykLac8RzLOCmFvusYSyn6aZd_0_Tz2RlYrdQ50maAgB2ysuV21l2RScjeBJS6ChXDZijkkQ4pFNN2aR0CRzsoKk77CiTFeBLVd0keFDgdgigPybs7TmZ5bTcMAvTDxFfRig6usnM8_f30R5K6CxGqf8BWQQ_TQ",
    //         },
    //         {
    //           position: 6,
    //           title: "Uniqlo Men's Pleated Wide Pants",
    //           product_id: "13427832801994521124",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=13427832801994521124",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=productid:13427832801994521124,headlineOfferDocid:13427832801994521124,imageDocid:4362122295070108320,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMTM0Mjc4MzI4MDE5OTQ1MjExMjQiLCJjYXRhbG9naWQiOiIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxMzQyNzgzMjgwMTk5NDUyMTEyNCIsImltYWdlRG9jaWQiOiI0MzYyMTIyMjk1MDcwMTA4MzIwIiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMTM0Mjc4MzI4MDE5OTQ1MjExMjQiLCJjYXRhbG9naWQiOiIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxMzQyNzgzMjgwMTk5NDUyMTEyNCIsImltYWdlRG9jaWQiOiI0MzYyMTIyMjk1MDcwMTA4MzIwIiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //           source: "Poshmark",
    //           source_icon:
    //             "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcQgE5YW9q7ce-TY-ORlvWjWfhcq61HU1-cph5DDKWEFIARUAQSdI7Q7a_t3VW7jGLqcgcFb_1KWHtfMCXQ2pUUEd_NU0jU",
    //           price: "$40.00",
    //           extracted_price: 40,
    //           rating: null,
    //           thumbnail:
    //             "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSG34L05b4QxP0TL2aZnKXPAy8vc3qB2MEHnuQWtzVX-qvS92KOUCJMCh9U6qRWoPfhJNrR1YmbhRJ7o6BPoBITCGB22UUzpa3zhuWaFWUNzCAScK7zT4S7",
    //           serpapi_thumbnail:
    //             "https://serpapi.com/images/url/79LI33icDcldEkJAAADgExUtJWaaBlPKX8KmemPJerC7WCZ7qO7Tbep7_b4fzDkbDEmqCOpnxqtywQsiL-uB57xBS0RbacCUsYbU-273P8MMS91BiaOovrwu1Os7klMf5E_i3SNz3k5I6SwQHE5kvGZc3O6Lbkp04F2g7QY21uGmizMavbAb9vHq0RY4djW6sSJqnVPbsQCAULBcEXjM8mMGQ2GbCfI0kaqJ9gOYpjwW",
    //         },
    //         {
    //           position: 7,
    //           title: "Uniqlo Pleated Dress Pant",
    //           product_id: "17456619856103664466",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=17456619856103664466",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=productid:17456619856103664466,headlineOfferDocid:17456619856103664466,imageDocid:7370784450495167903,rds:PC_384375334012251989|PROD_PC_384375334012251989,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMTc0NTY2MTk4NTYxMDM2NjQ0NjYiLCJjYXRhbG9naWQiOiIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNzQ1NjYxOTg1NjEwMzY2NDQ2NiIsImltYWdlRG9jaWQiOiI3MzcwNzg0NDUwNDk1MTY3OTAzIiwicmRzIjoiUENfMzg0Mzc1MzM0MDEyMjUxOTg5fFBST0RfUENfMzg0Mzc1MzM0MDEyMjUxOTg5IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMTc0NTY2MTk4NTYxMDM2NjQ0NjYiLCJjYXRhbG9naWQiOiIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNzQ1NjYxOTg1NjEwMzY2NDQ2NiIsImltYWdlRG9jaWQiOiI3MzcwNzg0NDUwNDk1MTY3OTAzIiwicmRzIjoiUENfMzg0Mzc1MzM0MDEyMjUxOTg5fFBST0RfUENfMzg0Mzc1MzM0MDEyMjUxOTg5IiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //           source: "eBay",
    //           source_icon:
    //             "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcSN1XmQeJU_yT0zcxhHYWuffZKmEBeCLcmLdkaZM422mZbdDohDeZ1F0htTlz68NMC5ys71nX8kDNtoHo_3z5uYipJX7A",
    //           price: "$39.00",
    //           extracted_price: 39,
    //           second_hand_condition: "pre-owned",
    //           rating: 5,
    //           reviews: 1,
    //           thumbnail:
    //             "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcSGwpZHW4h4pLjwvLlLZvp4-UdkarJ9WZRxrDSthQYuqU2Wa8z7GawsQupzMddyRZWoKPN3dHImJrQ11hH3xkA2jS8FCV5LIO2NhNfPRJOQ",
    //           serpapi_thumbnail:
    //             "https://serpapi.com/images/url/QW3gXnicDcnbEkJAAADQL8K4NGGmaUxNLgnLaCdv2pVFWKzr5_RX_U2d1_P9EMbooAtC1qB-pSzDHHs2Mp8PLGUF4lFbCwNpKS2a_Ngd_qcbHtZMFJkzTSyoEIW65Ty5bzeZqMLFuEp7R4NJuPTniBHwGLtYgqm67c10HsBItxvGa5jA9hp4Mrbs2umBKBJLXipDKiP1crrvXNuXPOK9gtDxwQ-ZuDos",
    //           delivery: "Free delivery",
    //         },
    //         {
    //           position: 8,
    //           title: "Uniqlo Airism Pleated Slim Trousers",
    //           product_id: "15652178791257936098",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=15652178791257936098",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=productid:15652178791257936098,headlineOfferDocid:15652178791257936098,imageDocid:7008053669474484330,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMTU2NTIxNzg3OTEyNTc5MzYwOTgiLCJjYXRhbG9naWQiOiIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNTY1MjE3ODc5MTI1NzkzNjA5OCIsImltYWdlRG9jaWQiOiI3MDA4MDUzNjY5NDc0NDg0MzMwIiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMTU2NTIxNzg3OTEyNTc5MzYwOTgiLCJjYXRhbG9naWQiOiIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNTY1MjE3ODc5MTI1NzkzNjA5OCIsImltYWdlRG9jaWQiOiI3MDA4MDUzNjY5NDc0NDg0MzMwIiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //           source: "Poshmark",
    //           source_icon:
    //             "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcQgE5YW9q7ce-TY-ORlvWjWfhcq61HU1-cph5DDKWEFIARUAQSdI7Q7a_t3VW7jGLqcgcFb_1KWHtfMCXQ2pUUEd_NU0jU",
    //           price: "$23.00",
    //           extracted_price: 23,
    //           second_hand_condition: "pre-owned",
    //           rating: null,
    //           thumbnail:
    //             "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTSLMjXV5CTW-_druhVmUpAhiu3_ZpXGOOL8rFXj5BBzp4FBrnt-4rwHnje5RXCkfbC1BmICMrECQZb_HByczQ1fhh-j_cOjVvdFfddkBth7E1wxbCQGoLo",
    //           serpapi_thumbnail:
    //             "https://serpapi.com/images/url/9xlFBHicDcltCoIwAADQE6lYSiVEuOFHoIllJv6R3NQ5ca45szxU9-k29f6-74dIyUdL0yqGxJvLCiuyZCu1GeVdtkhFQ6-NZOC8Zc3hsf-fZZ_wzkPJJQhplpowuSkFFhNJ-yu3STuti5xnXhQFW-Fm1ARg4YYLBJOKIWaf0co8Z7CrS6iD_ghD4cA4LwsfvNES6zUhCi1QRNMndmuMOyDJxtHnVwljbwiGHzd0Ppk",
    //           tag: "54% OFF",
    //           extensions: ["54% OFF"],
    //         },
    //       ],
    //     },
    //     {
    //       title: "Deals",
    //       shopping_results: [
    //         {
    //           position: 1,
    //           title:
    //             "UNIQLO Silky Pleated High Rise Elastic Waist Wide Leg Culottes",
    //           product_id: "17256987073037721539",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=17256987073037721539",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=productid:17256987073037721539,headlineOfferDocid:17256987073037721539,imageDocid:4693830930377807595,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMTcyNTY5ODcwNzMwMzc3MjE1MzkiLCJjYXRhbG9naWQiOiIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNzI1Njk4NzA3MzAzNzcyMTUzOSIsImltYWdlRG9jaWQiOiI0NjkzODMwOTMwMzc3ODA3NTk1IiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMTcyNTY5ODcwNzMwMzc3MjE1MzkiLCJjYXRhbG9naWQiOiIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNzI1Njk4NzA3MzAzNzcyMTUzOSIsImltYWdlRG9jaWQiOiI0NjkzODMwOTMwMzc3ODA3NTk1IiwicmRzIjoiIiwicXVlcnkiOiJVbmlxbG8rUGxlYXRlZCtUcm91c2VycyIsImdwY2lkIjoiIiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //           source: "eBay - beverlyhillsclosets48",
    //           source_icon:
    //             "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcQCSoeiwwKkumV2aNvhjSlaa0ZcuAjm4JjDQLWyS_eDqznJjKil6DM7NxnTU4M5jkB0dGlwhR2voLnxXgQ6vVdpDpU-flw",
    //           price: "$27.99",
    //           extracted_price: 27.99,
    //           second_hand_condition: "pre-owned",
    //           rating: null,
    //           badge: "Small business",
    //           thumbnail:
    //             "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcRvdq1b0fjkp_avjp_VtX5w9URTb5-Sf3eReOR992CxQ5QHx_Pnx6KTnMFul5e1aQ-bDlb54aSG6fY6AapcRDiQJVz8-7zsyOi2jo3KDN0",
    //           serpapi_thumbnail:
    //             "https://serpapi.com/images/url/lH9av3icDclJDoIwAADAF7FbFBJjiESMRJCKRE-kLWUTS5GKwG98lr_Ruc73UwrBe1tRKCPPiQuaSQIzQy56gURFZNI-lL5sOa9YsenW_7OdILM8Aoes07Ca13eeoqHmaSKu4G1dYIyBdM4NCmkILUvfjhGI9mN6YqPpx-y4ezWAaiiSsNtgsEBnz8xvpoM4gW4VHZJ5JS3nfgorvW4N3w3UHxi-ONY",
    //           tag: "30% OFF",
    //           extensions: ["30% OFF"],
    //         },
    //         {
    //           position: 2,
    //           title: "Uniqlo Pleated Wide Trousers",
    //           product_id: "2620124638902094211",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=2620124638902094211",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=productid:2620124638902094211,headlineOfferDocid:2620124638902094211,imageDocid:11545268970034070356,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMjYyMDEyNDYzODkwMjA5NDIxMSIsImNhdGFsb2dpZCI6IiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjI2MjAxMjQ2Mzg5MDIwOTQyMTEiLCJpbWFnZURvY2lkIjoiMTE1NDUyNjg5NzAwMzQwNzAzNTYiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ==",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMjYyMDEyNDYzODkwMjA5NDIxMSIsImNhdGFsb2dpZCI6IiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjI2MjAxMjQ2Mzg5MDIwOTQyMTEiLCJpbWFnZURvY2lkIjoiMTE1NDUyNjg5NzAwMzQwNzAzNTYiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ%3D%3D",
    //           source: "Poshmark",
    //           source_icon:
    //             "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcQgE5YW9q7ce-TY-ORlvWjWfhcq61HU1-cph5DDKWEFIARUAQSdI7Q7a_t3VW7jGLqcgcFb_1KWHtfMCXQ2pUUEd_NU0jU",
    //           price: "$30.00",
    //           extracted_price: 30,
    //           second_hand_condition: "pre-owned",
    //           rating: null,
    //           thumbnail:
    //             "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcTuUyyrSaoE6m-uyYaVnmMVBO9ixX9Gsi5u-36SVU5cA2XH0NS_FCg6OJGXenzRUWaNzdrdJFI_df9EAu6IrfxXqkVuxl82k-PcQ2pAEL-R",
    //           serpapi_thumbnail:
    //             "https://serpapi.com/images/url/vMK_VXicDcltCoIwAADQE03FUFKIsFBTSktz2S-xzY9hzuk2UI_TrbpNvb_v-2mFYNxW1YqiaWGiwkC8qKY0XJSCIAUNvcrbgTFCm_24-5_tRNjy0V1myzKl5eCaPZDLs4S0v8BDbJE5t3xODAk2ZgozAzl6ftKitPCOjRmHfl7RNckeZbTiCYdeUODach1pBlM952MH5fze6h24opvOHPcMkh9guTmz",
    //           tag: "40% OFF",
    //           extensions: ["40% OFF"],
    //         },
    //         {
    //           position: 3,
    //           title: "Uniqlo Pleated Wide Pants",
    //           product_id: "16585821396208308435",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=16585821396208308435",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=productid:16585821396208308435,headlineOfferDocid:16585821396208308435,imageDocid:10117406192778842920,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMTY1ODU4MjEzOTYyMDgzMDg0MzUiLCJjYXRhbG9naWQiOiIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNjU4NTgyMTM5NjIwODMwODQzNSIsImltYWdlRG9jaWQiOiIxMDExNzQwNjE5Mjc3ODg0MjkyMCIsInJkcyI6IiIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IiIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMTY1ODU4MjEzOTYyMDgzMDg0MzUiLCJjYXRhbG9naWQiOiIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNjU4NTgyMTM5NjIwODMwODQzNSIsImltYWdlRG9jaWQiOiIxMDExNzQwNjE5Mjc3ODg0MjkyMCIsInJkcyI6IiIsInF1ZXJ5IjoiVW5pcWxvK1BsZWF0ZWQrVHJvdXNlcnMiLCJncGNpZCI6IiIsIm1pZCI6IiIsInB2dCI6ImEiLCJ1dWxlIjpudWxsLCJnbCI6InVzIiwiaGwiOiJlbiJ9",
    //           source: "Poshmark",
    //           source_icon:
    //             "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcQgE5YW9q7ce-TY-ORlvWjWfhcq61HU1-cph5DDKWEFIARUAQSdI7Q7a_t3VW7jGLqcgcFb_1KWHtfMCXQ2pUUEd_NU0jU",
    //           price: "$40.00",
    //           extracted_price: 40,
    //           old_price: "$100",
    //           extracted_old_price: 100,
    //           rating: null,
    //           thumbnail:
    //             "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcS45jRKbEwJN9JSdGKjEGGDjTeGAHJJHyOl3TIty5TPPyLhNvGMqYefK3tHTG1OvWvaG87mFSXpRUfQ5NEPmYaMJKCg7RDv4bD3uGFVGkZvnurBmNk92gbL",
    //           serpapi_thumbnail:
    //             "https://serpapi.com/images/url/cPdWlXicDcnbEkJAGADgJ4pKpphpGkW_FkvooDvnQ2GxtvFSvU9vU9_t9_0UlJJB5vm0ifuJ0DSZ0aiZc_lAQ1rGXNzW_FC0hJRNvuu2_5MVnEgQeyuxco1IeyMsIS8Bo9IA1MpPQdER0if7JfgnOom-40xmgRlYXZBmhkB1HxY2u7EQNuv66N2Je8nOItacOggtZBzytauyVaQKIxyv8HywZuz3NX5Kyzwyf8-HPPo",
    //           tag: "60% OFF",
    //           extensions: ["60% OFF"],
    //         },
    //         {
    //           position: 4,
    //           title: "Uniqlo Pleated Wide Pants",
    //           product_id: "18304939369571663727",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=18304939369571663727",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=productid:18304939369571663727,headlineOfferDocid:18304939369571663727,imageDocid:5498284479401640269,rds:PC_6336871411114913453|PROD_PC_6336871411114913453,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMTgzMDQ5MzkzNjk1NzE2NjM3MjciLCJjYXRhbG9naWQiOiIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxODMwNDkzOTM2OTU3MTY2MzcyNyIsImltYWdlRG9jaWQiOiI1NDk4Mjg0NDc5NDAxNjQwMjY5IiwicmRzIjoiUENfNjMzNjg3MTQxMTExNDkxMzQ1M3xQUk9EX1BDXzYzMzY4NzE0MTExMTQ5MTM0NTMiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ==",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMTgzMDQ5MzkzNjk1NzE2NjM3MjciLCJjYXRhbG9naWQiOiIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxODMwNDkzOTM2OTU3MTY2MzcyNyIsImltYWdlRG9jaWQiOiI1NDk4Mjg0NDc5NDAxNjQwMjY5IiwicmRzIjoiUENfNjMzNjg3MTQxMTExNDkxMzQ1M3xQUk9EX1BDXzYzMzY4NzE0MTExMTQ5MTM0NTMiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ%3D%3D",
    //           source: "Poshmark",
    //           source_icon:
    //             "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcQgE5YW9q7ce-TY-ORlvWjWfhcq61HU1-cph5DDKWEFIARUAQSdI7Q7a_t3VW7jGLqcgcFb_1KWHtfMCXQ2pUUEd_NU0jU",
    //           price: "$30.00",
    //           extracted_price: 30,
    //           old_price: "$50",
    //           extracted_old_price: 50,
    //           rating: 4.9,
    //           reviews: 25,
    //           thumbnail:
    //             "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcSAnf8G8tfV4Xt6OMh6wVAoDdw60_slyUk23pue-_dpNdi5-ctO9XJ5ItCAC6h9k7wNbY-cxchdvD3Cjp80BZPgH_bq0FC4ifI44AbTiKWXNBVEfjj21d8fWA",
    //           serpapi_thumbnail:
    //             "https://serpapi.com/images/url/36fWC3icDclLDoIwFADAEyFfEUyMqeA_FhMV0A2RltKiQrVPkVt5HW-js53vhwNINdT1oiaPTkJBNchrs1cqOIMgPdLcdMUbKUVdju-j_w0Rpv6c7FDNvLkHLHZScKMNd9sYNSFtXSNT1-5wsWz5LLSMSkxFXyMQ-emqv4QABS73L4MW50eNvAmnr9AOKukZk9O2XGT53ZgFjmBLx0H5XqyTFE_iKasqy6QeS9APb1A9PQ",
    //           tag: "40% OFF",
    //           extensions: ["40% OFF"],
    //         },
    //         {
    //           position: 5,
    //           title: "UNIQLO Pleated Wide Trousers",
    //           product_id: "5843729176708149102",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=5843729176708149102",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=catalogid:5843729176708149102,headlineOfferDocid:17596874881358534785,imageDocid:3381711181255793956,gpcid:3851828090201720217,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiNTg0MzcyOTE3NjcwODE0OTEwMiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjE3NTk2ODc0ODgxMzU4NTM0Nzg1IiwiaW1hZ2VEb2NpZCI6IjMzODE3MTExODEyNTU3OTM5NTYiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIzODUxODI4MDkwMjAxNzIwMjE3IiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0=",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiIiwiY2F0YWxvZ2lkIjoiNTg0MzcyOTE3NjcwODE0OTEwMiIsImhlYWRsaW5lT2ZmZXJEb2NpZCI6IjE3NTk2ODc0ODgxMzU4NTM0Nzg1IiwiaW1hZ2VEb2NpZCI6IjMzODE3MTExODEyNTU3OTM5NTYiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIzODUxODI4MDkwMjAxNzIwMjE3IiwibWlkIjoiIiwicHZ0IjoiYSIsInV1bGUiOm51bGwsImdsIjoidXMiLCJobCI6ImVuIn0%3D",
    //           source: "Poshmark",
    //           source_icon:
    //             "https://encrypted-tbn3.gstatic.com/favicon-tbn?q=tbn%3AANd9GcQgE5YW9q7ce-TY-ORlvWjWfhcq61HU1-cph5DDKWEFIARUAQSdI7Q7a_t3VW7jGLqcgcFb_1KWHtfMCXQ2pUUEd_NU0jU",
    //           multiple_sources: true,
    //           price: "$20.00",
    //           extracted_price: 20,
    //           second_hand_condition: "pre-owned",
    //           rating: null,
    //           thumbnail:
    //             "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcReGPw8baEEbYpazLFEr--Z8N83GddxhybAosiqma2T0WsMYJ-AF7aEKmi3fh0SZUcv0IIDw9j2yqnls-i4yVquoTABVuJVDdxb22do3eyjcN1pRB8J4c64IA",
    //           serpapi_thumbnail:
    //             "https://serpapi.com/images/url/XQq9DXicDcltCoIwAADQEy1NpUyImKSilYSZYf_2YbrIbbZZrVN1nW5T7-_7fjqtpQosq-HkbqRuKNCY25NWaaQZmRDRW6oTUjLerobl_wKY00VCiibZP32MogjXEr23cXQH4OznvptQ-uoMhkKxoUdOaZ_Urs4AjOco2vTMvXT24XwkDztN18_F1TEDvynAPFMNoyhhWI1ZtaYv7DhUuI25knwqi9DPPDLzUvgDk9k-Bw",
    //           tag: "50% OFF",
    //           extensions: ["50% OFF"],
    //         },
    //         {
    //           position: 6,
    //           title: "Uniqlo Women's Pleated Wide Pants",
    //           product_id: "15060760850835358794",
    //           serpapi_product_api:
    //             "https://serpapi.com/search.json?engine=google_product&gl=us&google_domain=google.com&hl=en&product_id=15060760850835358794",
    //           product_link:
    //             "https://www.google.com/search?ibp=oshop&q=Uniqlo Pleated Trousers&prds=productid:15060760850835358794,headlineOfferDocid:15060760850835358794,imageDocid:978773684607632212,pvt:a&hl=en&gl=us&udm=28",
    //           immersive_product_page_token:
    //             "eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMTUwNjA3NjA4NTA4MzUzNTg3OTQiLCJjYXRhbG9naWQiOiIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNTA2MDc2MDg1MDgzNTM1ODc5NCIsImltYWdlRG9jaWQiOiI5Nzg3NzM2ODQ2MDc2MzIyMTIiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ==",
    //           serpapi_immersive_product_api:
    //             "https://serpapi.com/search.json?engine=google_immersive_product&page_token=eyJlaSI6IkhlX3phTjJuTEptaXF0c1A3Yl9VNlFNIiwicHJvZHVjdGlkIjoiMTUwNjA3NjA4NTA4MzUzNTg3OTQiLCJjYXRhbG9naWQiOiIiLCJoZWFkbGluZU9mZmVyRG9jaWQiOiIxNTA2MDc2MDg1MDgzNTM1ODc5NCIsImltYWdlRG9jaWQiOiI5Nzg3NzM2ODQ2MDc2MzIyMTIiLCJyZHMiOiIiLCJxdWVyeSI6IlVuaXFsbytQbGVhdGVkK1Ryb3VzZXJzIiwiZ3BjaWQiOiIiLCJtaWQiOiIiLCJwdnQiOiJhIiwidXVsZSI6bnVsbCwiZ2wiOiJ1cyIsImhsIjoiZW4ifQ%3D%3D",
    //           source: "Mercari",
    //           source_icon:
    //             "https://encrypted-tbn0.gstatic.com/favicon-tbn?q=tbn%3AANd9GcTLmA5xX97YEyUeWttyp0GZJoClgBhChGvNVAgVZG1iY4w1WterJxcgj1K9DQWQeWmoxdOF-_ORNeOMQysiGBy38MCwRDT4jB0",
    //           price: "$28.00",
    //           extracted_price: 28,
    //           old_price: "$35",
    //           extracted_old_price: 35,
    //           rating: null,
    //           thumbnail:
    //             "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQ8ZBUpjd3dhpI4BmQtbU4fOGldBkKnDzrWrCZA4HDMOO_u82i-uvoaT8ezRGKoloOGnAOzaLTCRf10b_WQejx0ZuBYPQnNj1F87scISvk",
    //           serpapi_thumbnail:
    //             "https://serpapi.com/images/url/0idZH3icDcnbCoIwAADQL_JWQiZEeCETyzVTJF9EN--6LZ1S_k2f1d_UeT3fT805m3RJKgga34wXWOA5kcVq4hlvkIjoIE01Zawh1fF5-J9u-HjvIKglZsRavMU1c1VzgDyP1BI4PTY7j9jrGI9WYqhn-wpAOmubRpgXmoVasQaOR3sKHGKANbuEVlAqcp7GsGhfcjKbjxskfquctN2E3PvS_QAYqDmr",
    //           tag: "20% OFF",
    //           extensions: ["20% OFF"],
    //           delivery: "Free delivery",
    //         },
    //       ],
    //     },
    //   ],
    //   filters: [
    //     {
    //       type: "Refine results",
    //       input_type: "link_with_icon",
    //       options: [
    //         {
    //           text: "On sale",
    //           shoprs:
    //             "CAESBEoCGAEYBioXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyEwgGEgdPbiBzYWxlGAIiBEoCGAFY86cgYAI",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=Uniqlo+Pleated+Trousers+sale&shoprs=CAESBEoCGAEYBioXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyEwgGEgdPbiBzYWxlGAIiBEoCGAFY86cgYAI",
    //         },
    //         {
    //           text: "New",
    //           shoprs:
    //             "CAEYCioXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyBwgKEgNOZXdY86cgYAI",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=new+Uniqlo+Pleated+Trousers&shoprs=CAEYCioXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyBwgKEgNOZXdY86cgYAI",
    //         },
    //         {
    //           text: "Used",
    //           shoprs:
    //             "CAEYCioXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyCAgKEgRVc2VkWPOnIGAC",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=used+Uniqlo+Pleated+Trousers&shoprs=CAEYCioXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyCAgKEgRVc2VkWPOnIGAC",
    //         },
    //         {
    //           text: "Small business",
    //           shoprs:
    //             "CAESAmoAGBYqF3VuaXFsbyBwbGVhdGVkIHRyb3VzZXJzMhwIFhIOU21hbGwgYnVzaW5lc3MiAmoAKgQQARgBYAI",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=uniqlo+pleated+trousers&shoprs=CAESAmoAGBYqF3VuaXFsbyBwbGVhdGVkIHRyb3VzZXJzMhwIFhIOU21hbGwgYnVzaW5lc3MiAmoAKgQQARgBYAI",
    //         },
    //       ],
    //     },
    //     {
    //       type: "Department",
    //       input_type: "checkbox",
    //       options: [
    //         {
    //           text: "Men's",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFQgBEgVNZW4nczoKCICjPhCBoz4wBVjzpyBgAg",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=men%27s+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFQgBEgVNZW4nczoKCICjPhCBoz4wBVjzpyBgAg",
    //         },
    //         {
    //           text: "Women's",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFwgBEgdXb21lbidzOgoIgKM-EIKjPjAFWPOnIGAC",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=women%27s+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFwgBEgdXb21lbidzOgoIgKM-EIKjPjAFWPOnIGAC",
    //         },
    //       ],
    //     },
    //     {
    //       type: "Leg Style",
    //       input_type: "checkbox",
    //       options: [
    //         {
    //           text: "Wide Leg",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGggBEghXaWRlIExlZzoMCIKAgwEQiICDATAAWPOnIGAC",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=wide+leg+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGggBEghXaWRlIExlZzoMCIKAgwEQiICDATAAWPOnIGAC",
    //         },
    //         {
    //           text: "Straight Leg",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyHggBEgxTdHJhaWdodCBMZWc6DAiCgIMBEIeAgwEwAFjzpyBgAg",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=straight+leg+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyHggBEgxTdHJhaWdodCBMZWc6DAiCgIMBEIeAgwEwAFjzpyBgAg",
    //         },
    //       ],
    //     },
    //     {
    //       type: "Color",
    //       input_type: "color",
    //       options: [
    //         {
    //           text: "Black",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFwgBEgVCbGFjazoMCNiM9QEQ5Yr1ATALWPOnIGAC",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=black+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFwgBEgVCbGFjazoMCNiM9QEQ5Yr1ATALWPOnIGAC",
    //         },
    //         {
    //           text: "Gray",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFggBEgRHcmF5OgwI2Iz1ARDqivUBMAtY86cgYAI",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=gray+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFggBEgRHcmF5OgwI2Iz1ARDqivUBMAtY86cgYAI",
    //         },
    //         {
    //           text: "Brown",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFwgBEgVCcm93bjoMCNiM9QEQ64r1ATALWPOnIGAC",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=brown+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFwgBEgVCcm93bjoMCNiM9QEQ64r1ATALWPOnIGAC",
    //         },
    //         {
    //           text: "Navy Blue",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGwgBEglOYXZ5IEJsdWU6DAjYjPUBEIeM9QEwC1jzpyBgAg",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=navy+blue+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGwgBEglOYXZ5IEJsdWU6DAjYjPUBEIeM9QEwC1jzpyBgAg",
    //         },
    //       ],
    //     },
    //     {
    //       type: "Features",
    //       input_type: "checkbox",
    //       options: [
    //         {
    //           text: "With Pockets",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyIAgBEgxXaXRoIFBvY2tldHMYAjoMCLXapAMQ2dykAzADWPOnIGAC",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=uniqlo+pleated+trousers+with+pockets&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyIAgBEgxXaXRoIFBvY2tldHMYAjoMCLXapAMQ2dykAzADWPOnIGAC",
    //         },
    //         {
    //           text: "Cropped",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGQgBEgdDcm9wcGVkOgwIgsGfARCDwZ8BMANY86cgYAI",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=cropped+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGQgBEgdDcm9wcGVkOgwIgsGfARCDwZ8BMANY86cgYAI",
    //         },
    //         {
    //           text: "Recycled Materials",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyJAgBEhJSZWN5Y2xlZCBNYXRlcmlhbHM6DAiUtIcCEJW0hwIwA1jzpyBgAg",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=recycled+materials+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyJAgBEhJSZWN5Y2xlZCBNYXRlcmlhbHM6DAiUtIcCEJW0hwIwA1jzpyBgAg",
    //         },
    //         {
    //           text: "Breathable",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyHAgBEgpCcmVhdGhhYmxlOgwIvsWjAxDxzqMDMANY86cgYAI",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=breathable+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyHAgBEgpCcmVhdGhhYmxlOgwIvsWjAxDxzqMDMANY86cgYAI",
    //         },
    //       ],
    //     },
    //     {
    //       type: "Rise",
    //       input_type: "checkbox",
    //       options: [
    //         {
    //           text: "High Rise",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGwgBEglIaWdoIFJpc2U6DAjNvJ4BEM68ngEwAFjzpyBgAg",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=high+rise+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGwgBEglIaWdoIFJpc2U6DAjNvJ4BEM68ngEwAFjzpyBgAg",
    //         },
    //         {
    //           text: "Mid Rise",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGggBEghNaWQgUmlzZToMCM28ngEQ5cCfATAAWPOnIGAC",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=mid+rise+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGggBEghNaWQgUmlzZToMCM28ngEQ5cCfATAAWPOnIGAC",
    //         },
    //       ],
    //     },
    //     {
    //       type: "Style",
    //       input_type: "checkbox",
    //       options: [
    //         {
    //           text: "Dress Pants",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGwgBEgtEcmVzcyBQYW50czoKCPv9ORD9_TkwAljzpyBgAg",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=dress+pants+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGwgBEgtEcmVzcyBQYW50czoKCPv9ORD9_TkwAljzpyBgAg",
    //         },
    //         {
    //           text: "Cargo Pants",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGwgBEgtDYXJnbyBQYW50czoKCPv9ORD8_TkwAljzpyBgAg",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=cargo+pants+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGwgBEgtDYXJnbyBQYW50czoKCPv9ORD8_TkwAljzpyBgAg",
    //         },
    //         {
    //           text: "Leggings",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGAgBEghMZWdnaW5nczoKCPv9ORCB_jkwAljzpyBgAg",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=leggings+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGAgBEghMZWdnaW5nczoKCPv9ORCB_jkwAljzpyBgAg",
    //         },
    //         {
    //           text: "Palazzo Pants",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyHQgBEg1QYWxhenpvIFBhbnRzOgoI-_05EJzWPTACWPOnIGAC",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=palazzo+pants+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyHQgBEg1QYWxhenpvIFBhbnRzOgoI-_05EJzWPTACWPOnIGAC",
    //         },
    //       ],
    //     },
    //     {
    //       type: "Size Type",
    //       input_type: "checkbox",
    //       options: [
    //         {
    //           text: "Petite",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGAgBEgZQZXRpdGU6DAiH97QCEIr3tAIwAFjzpyBgAg",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=petite+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGAgBEgZQZXRpdGU6DAiH97QCEIr3tAIwAFjzpyBgAg",
    //         },
    //         {
    //           text: "Plus",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFggBEgRQbHVzOgwIh_e0AhCL97QCMABY86cgYAI",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=plus+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFggBEgRQbHVzOgwIh_e0AhCL97QCMABY86cgYAI",
    //         },
    //       ],
    //     },
    //     {
    //       type: "Category",
    //       input_type: "link",
    //       options: [
    //         {
    //           text: "Corduroy Pants",
    //           shoprs:
    //             "CAEYCSoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyEggJEg5Db3JkdXJveSBQYW50c2AC",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=corduroy+pants+uniqlo+pleated+trousers&shoprs=CAEYCSoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyEggJEg5Db3JkdXJveSBQYW50c2AC",
    //         },
    //         {
    //           text: "Kids' Pants & Leggings",
    //           shoprs:
    //             "CAEYCSoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGggJEhZLaWRzJyBQYW50cyAmIExlZ2dpbmdzYAI",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=kids%27+pants+%26+leggings+uniqlo+pleated+trousers&shoprs=CAEYCSoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGggJEhZLaWRzJyBQYW50cyAmIExlZ2dpbmdzYAI",
    //         },
    //         {
    //           text: "Chinos & Khakis",
    //           shoprs:
    //             "CAEYCSoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyEwgJEg9DaGlub3MgJiBLaGFraXNgAg",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=chinos+%26+khakis+uniqlo+pleated+trousers&shoprs=CAEYCSoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyEwgJEg9DaGlub3MgJiBLaGFraXNgAg",
    //         },
    //       ],
    //     },
    //     {
    //       type: "Pattern",
    //       input_type: "checkbox",
    //       options: [
    //         {
    //           text: "Plaid",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFQgBEgVQbGFpZDoKCPGFPhD5hT4wAFjzpyBgAg",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=plaid+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFQgBEgVQbGFpZDoKCPGFPhD5hT4wAFjzpyBgAg",
    //         },
    //         {
    //           text: "Striped",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFwgBEgdTdHJpcGVkOgoI8YU-EPKFPjAAWPOnIGAC",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=striped+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFwgBEgdTdHJpcGVkOgoI8YU-EPKFPjAAWPOnIGAC",
    //         },
    //       ],
    //     },
    //     {
    //       type: "Women's Size",
    //       input_type: "size_button",
    //       options: [
    //         {
    //           text: "XS",
    //           shoprs:
    //             "CAESCgoICJqHRhCCiEYYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyPwgBEgJYUyIKCggImodGEIKIRioTCg9Xb21lbidzIHNpemUgWFMYAToWCNeHngMQyIaeAxiCoz4gASiah0YwAFjzpyBgAmojCNeHngMQgqM-GhTIhp4D1s-dA8mGngPXz50DyoaeAyCah0Y",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=women%27s+size+xs+uniqlo+pleated+trousers&shoprs=CAESCgoICJqHRhCCiEYYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyPwgBEgJYUyIKCggImodGEIKIRioTCg9Xb21lbidzIHNpemUgWFMYAToWCNeHngMQyIaeAxiCoz4gASiah0YwAFjzpyBgAmojCNeHngMQgqM-GhTIhp4D1s-dA8mGngPXz50DyoaeAyCah0Y",
    //         },
    //         {
    //           text: "S",
    //           shoprs:
    //             "CAESCgoICJqHRhCDiEYYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyPQgBEgFTIgoKCAiah0YQg4hGKhIKDldvbWVuJ3Mgc2l6ZSBTGAE6FgjXh54DENbPnQMYgqM-IAEomodGMABY86cgYAJqIwjXh54DEIKjPhoUyIaeA9bPnQPJhp4D18-dA8qGngMgmodG",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=women%27s+size+s+uniqlo+pleated+trousers&shoprs=CAESCgoICJqHRhCDiEYYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyPQgBEgFTIgoKCAiah0YQg4hGKhIKDldvbWVuJ3Mgc2l6ZSBTGAE6FgjXh54DENbPnQMYgqM-IAEomodGMABY86cgYAJqIwjXh54DEIKjPhoUyIaeA9bPnQPJhp4D18-dA8qGngMgmodG",
    //         },
    //         {
    //           text: "M",
    //           shoprs:
    //             "CAESCgoICJqHRhCEiEYYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyPQgBEgFNIgoKCAiah0YQhIhGKhIKDldvbWVuJ3Mgc2l6ZSBNGAE6FgjXh54DEMmGngMYgqM-IAEomodGMABY86cgYAJqIwjXh54DEIKjPhoUyIaeA9bPnQPJhp4D18-dA8qGngMgmodG",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=women%27s+size+m+uniqlo+pleated+trousers&shoprs=CAESCgoICJqHRhCEiEYYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyPQgBEgFNIgoKCAiah0YQhIhGKhIKDldvbWVuJ3Mgc2l6ZSBNGAE6FgjXh54DEMmGngMYgqM-IAEomodGMABY86cgYAJqIwjXh54DEIKjPhoUyIaeA9bPnQPJhp4D18-dA8qGngMgmodG",
    //         },
    //         {
    //           text: "L",
    //           shoprs:
    //             "CAESCgoICJqHRhCFiEYYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyPQgBEgFMIgoKCAiah0YQhYhGKhIKDldvbWVuJ3Mgc2l6ZSBMGAE6FgjXh54DENfPnQMYgqM-IAEomodGMABY86cgYAJqIwjXh54DEIKjPhoUyIaeA9bPnQPJhp4D18-dA8qGngMgmodG",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=women%27s+size+l+uniqlo+pleated+trousers&shoprs=CAESCgoICJqHRhCFiEYYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyPQgBEgFMIgoKCAiah0YQhYhGKhIKDldvbWVuJ3Mgc2l6ZSBMGAE6FgjXh54DENfPnQMYgqM-IAEomodGMABY86cgYAJqIwjXh54DEIKjPhoUyIaeA9bPnQPJhp4D18-dA8qGngMgmodG",
    //         },
    //         {
    //           text: "XL",
    //           shoprs:
    //             "CAESCgoICJqHRhCGiEYYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyPwgBEgJYTCIKCggImodGEIaIRioTCg9Xb21lbidzIHNpemUgWEwYAToWCNeHngMQyoaeAxiCoz4gASiah0YwAFjzpyBgAmojCNeHngMQgqM-GhTIhp4D1s-dA8mGngPXz50DyoaeAyCah0Y",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=women%27s+size+xl+uniqlo+pleated+trousers&shoprs=CAESCgoICJqHRhCGiEYYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyPwgBEgJYTCIKCggImodGEIaIRioTCg9Xb21lbidzIHNpemUgWEwYAToWCNeHngMQyoaeAxiCoz4gASiah0YwAFjzpyBgAmojCNeHngMQgqM-GhTIhp4D1s-dA8mGngPXz50DyoaeAyCah0Y",
    //         },
    //       ],
    //     },
    //     {
    //       type: "Material",
    //       input_type: "checkbox",
    //       options: [
    //         {
    //           text: "Cotton",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFggBEgZDb3R0b246Cgj2kmMQ_5JjMABY86cgYAI",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=cotton+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFggBEgZDb3R0b246Cgj2kmMQ_5JjMABY86cgYAI",
    //         },
    //         {
    //           text: "Wool",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFAgBEgRXb29sOgoI9pJjEKmTYzAAWPOnIGAC",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=wool+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFAgBEgRXb29sOgoI9pJjEKmTYzAAWPOnIGAC",
    //         },
    //         {
    //           text: "Viscose",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGAgBEgdWaXNjb3NlOgsI9pJjEO_v2wMwAFjzpyBgAg",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=viscose+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGAgBEgdWaXNjb3NlOgsI9pJjEO_v2wMwAFjzpyBgAg",
    //         },
    //         {
    //           text: "Chiffon",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFwgBEgdDaGlmZm9uOgoI9pJjEP2SYzAAWPOnIGAC",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=chiffon+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFwgBEgdDaGlmZm9uOgoI9pJjEP2SYzAAWPOnIGAC",
    //         },
    //         {
    //           text: "Organic Cotton",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyHggBEg5PcmdhbmljIENvdHRvbjoKCPaSYxCVk2MwAFjzpyBgAg",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=organic+cotton+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyHggBEg5PcmdhbmljIENvdHRvbjoKCPaSYxCVk2MwAFjzpyBgAg",
    //         },
    //       ],
    //     },
    //     {
    //       type: "Price",
    //       input_type: "price_range",
    //       options: [
    //         {
    //           text: "Under $25",
    //           shoprs:
    //             "CAESDRILEQAAAACE13dBGAEYBSoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyIggFEglVbmRlciAkMjUYAiINEgsRAAAAAITXd0EYASoCGAFY86cgYAI",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=Uniqlo+Pleated+Trousers+under+%2425&shoprs=CAESDRILEQAAAACE13dBGAEYBSoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyIggFEglVbmRlciAkMjUYAiINEgsRAAAAAITXd0EYASoCGAFY86cgYAI",
    //         },
    //         {
    //           text: "$25 - $45",
    //           shoprs:
    //             "CAESFhIUCQAAAACE13dBEQAAAAAqdYVBGAEYBSoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyKwgFEgkkMjUgLSAkNDUYAiIWEhQJAAAAAITXd0ERAAAAACp1hUEYASoCGAFY86cgYAI",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=Uniqlo+Pleated+Trousers+between+%2425+and+%2445&shoprs=CAESFhIUCQAAAACE13dBEQAAAAAqdYVBGAEYBSoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyKwgFEgkkMjUgLSAkNDUYAiIWEhQJAAAAAITXd0ERAAAAACp1hUEYASoCGAFY86cgYAI",
    //         },
    //         {
    //           text: "Over $45",
    //           shoprs:
    //             "CAESDRILCQAAAAAqdYVBGAEYBSoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyIQgFEghPdmVyICQ0NRgCIg0SCwkAAAAAKnWFQRgBKgIYAVjzpyBgAg",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=Uniqlo+Pleated+Trousers+over+%2445&shoprs=CAESDRILCQAAAAAqdYVBGAEYBSoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyIQgFEghPdmVyICQ0NRgCIg0SCwkAAAAAKnWFQRgBKgIYAVjzpyBgAg",
    //         },
    //       ],
    //     },
    //     {
    //       type: "Men's Size",
    //       input_type: "size_button",
    //       options: [
    //         {
    //           text: "S",
    //           shoprs:
    //             "CAESCgoICJqHRhCDiEYYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyOwgBEgFTIgoKCAiah0YQg4hGKhAKDE1lbidzIHNpemUgUxgBOhYI14eeAxDWz50DGIGjPiABKJqHRjAAWPOnIGACahcI14eeAxCBoz4aCNbPnQPJhp4DIJqHRmorCKTFowMQgaM-Ghz0xKMDqMWjA_XEowPIxqMD9sSjA8nGowOqxaMDIJqHRg",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=men%27s+size+s+uniqlo+pleated+trousers&shoprs=CAESCgoICJqHRhCDiEYYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyOwgBEgFTIgoKCAiah0YQg4hGKhAKDE1lbidzIHNpemUgUxgBOhYI14eeAxDWz50DGIGjPiABKJqHRjAAWPOnIGACahcI14eeAxCBoz4aCNbPnQPJhp4DIJqHRmorCKTFowMQgaM-Ghz0xKMDqMWjA_XEowPIxqMD9sSjA8nGowOqxaMDIJqHRg",
    //         },
    //         {
    //           text: "M",
    //           shoprs:
    //             "CAESCgoICJqHRhCEiEYYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyOwgBEgFNIgoKCAiah0YQhIhGKhAKDE1lbidzIHNpemUgTRgBOhYI14eeAxDJhp4DGIGjPiABKJqHRjAAWPOnIGACahcI14eeAxCBoz4aCNbPnQPJhp4DIJqHRmorCKTFowMQgaM-Ghz0xKMDqMWjA_XEowPIxqMD9sSjA8nGowOqxaMDIJqHRg",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=men%27s+size+m+uniqlo+pleated+trousers&shoprs=CAESCgoICJqHRhCEiEYYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyOwgBEgFNIgoKCAiah0YQhIhGKhAKDE1lbidzIHNpemUgTRgBOhYI14eeAxDJhp4DGIGjPiABKJqHRjAAWPOnIGACahcI14eeAxCBoz4aCNbPnQPJhp4DIJqHRmorCKTFowMQgaM-Ghz0xKMDqMWjA_XEowPIxqMD9sSjA8nGowOqxaMDIJqHRg",
    //         },
    //         {
    //           text: "28",
    //           shoprs:
    //             "CAESCgoICJqHRhC2h0YYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyPQgBEgIyOCIKCggImodGELaHRioRCg1NZW4ncyBzaXplIDI4GAE6FgikxaMDEPTEowMYgaM-IAEomodGMABY86cgYAJqFwjXh54DEIGjPhoI1s-dA8mGngMgmodGaisIpMWjAxCBoz4aHPTEowOoxaMD9cSjA8jGowP2xKMDycajA6rFowMgmodG",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=men%27s+size+28+uniqlo+pleated+trousers&shoprs=CAESCgoICJqHRhC2h0YYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyPQgBEgIyOCIKCggImodGELaHRioRCg1NZW4ncyBzaXplIDI4GAE6FgikxaMDEPTEowMYgaM-IAEomodGMABY86cgYAJqFwjXh54DEIGjPhoI1s-dA8mGngMgmodGaisIpMWjAxCBoz4aHPTEowOoxaMD9cSjA8jGowP2xKMDycajA6rFowMgmodG",
    //         },
    //         {
    //           text: "30",
    //           shoprs:
    //             "CAESCgoICJqHRhC4h0YYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyPQgBEgIzMCIKCggImodGELiHRioRCg1NZW4ncyBzaXplIDMwGAE6FgikxaMDEKjFowMYgaM-IAEomodGMABY86cgYAJqFwjXh54DEIGjPhoI1s-dA8mGngMgmodGaisIpMWjAxCBoz4aHPTEowOoxaMD9cSjA8jGowP2xKMDycajA6rFowMgmodG",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=men%27s+size+30+uniqlo+pleated+trousers&shoprs=CAESCgoICJqHRhC4h0YYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyPQgBEgIzMCIKCggImodGELiHRioRCg1NZW4ncyBzaXplIDMwGAE6FgikxaMDEKjFowMYgaM-IAEomodGMABY86cgYAJqFwjXh54DEIGjPhoI1s-dA8mGngMgmodGaisIpMWjAxCBoz4aHPTEowOoxaMD9cSjA8jGowP2xKMDycajA6rFowMgmodG",
    //         },
    //         {
    //           text: "31",
    //           shoprs:
    //             "CAESCgoICJqHRhC5h0YYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyPQgBEgIzMSIKCggImodGELmHRioRCg1NZW4ncyBzaXplIDMxGAE6FgikxaMDEPXEowMYgaM-IAEomodGMABY86cgYAJqFwjXh54DEIGjPhoI1s-dA8mGngMgmodGaisIpMWjAxCBoz4aHPTEowOoxaMD9cSjA8jGowP2xKMDycajA6rFowMgmodG",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=men%27s+size+31+uniqlo+pleated+trousers&shoprs=CAESCgoICJqHRhC5h0YYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyPQgBEgIzMSIKCggImodGELmHRioRCg1NZW4ncyBzaXplIDMxGAE6FgikxaMDEPXEowMYgaM-IAEomodGMABY86cgYAJqFwjXh54DEIGjPhoI1s-dA8mGngMgmodGaisIpMWjAxCBoz4aHPTEowOoxaMD9cSjA8jGowP2xKMDycajA6rFowMgmodG",
    //         },
    //         {
    //           text: "32",
    //           shoprs:
    //             "CAESCgoICJqHRhC6h0YYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyPQgBEgIzMiIKCggImodGELqHRioRCg1NZW4ncyBzaXplIDMyGAE6FgikxaMDEMjGowMYgaM-IAEomodGMABY86cgYAJqFwjXh54DEIGjPhoI1s-dA8mGngMgmodGaisIpMWjAxCBoz4aHPTEowOoxaMD9cSjA8jGowP2xKMDycajA6rFowMgmodG",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=men%27s+size+32+uniqlo+pleated+trousers&shoprs=CAESCgoICJqHRhC6h0YYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyPQgBEgIzMiIKCggImodGELqHRioRCg1NZW4ncyBzaXplIDMyGAE6FgikxaMDEMjGowMYgaM-IAEomodGMABY86cgYAJqFwjXh54DEIGjPhoI1s-dA8mGngMgmodGaisIpMWjAxCBoz4aHPTEowOoxaMD9cSjA8jGowP2xKMDycajA6rFowMgmodG",
    //         },
    //         {
    //           text: "34",
    //           shoprs:
    //             "CAESCgoICJqHRhC8h0YYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyPQgBEgIzNCIKCggImodGELyHRioRCg1NZW4ncyBzaXplIDM0GAE6FgikxaMDEPbEowMYgaM-IAEomodGMABY86cgYAJqFwjXh54DEIGjPhoI1s-dA8mGngMgmodGaisIpMWjAxCBoz4aHPTEowOoxaMD9cSjA8jGowP2xKMDycajA6rFowMgmodG",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=men%27s+size+34+uniqlo+pleated+trousers&shoprs=CAESCgoICJqHRhC8h0YYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyPQgBEgIzNCIKCggImodGELyHRioRCg1NZW4ncyBzaXplIDM0GAE6FgikxaMDEPbEowMYgaM-IAEomodGMABY86cgYAJqFwjXh54DEIGjPhoI1s-dA8mGngMgmodGaisIpMWjAxCBoz4aHPTEowOoxaMD9cSjA8jGowP2xKMDycajA6rFowMgmodG",
    //         },
    //         {
    //           text: "35",
    //           shoprs:
    //             "CAESCgoICJqHRhC9h0YYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyPQgBEgIzNSIKCggImodGEL2HRioRCg1NZW4ncyBzaXplIDM1GAE6FgikxaMDEMnGowMYgaM-IAEomodGMABY86cgYAJqFwjXh54DEIGjPhoI1s-dA8mGngMgmodGaisIpMWjAxCBoz4aHPTEowOoxaMD9cSjA8jGowP2xKMDycajA6rFowMgmodG",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=men%27s+size+35+uniqlo+pleated+trousers&shoprs=CAESCgoICJqHRhC9h0YYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyPQgBEgIzNSIKCggImodGEL2HRioRCg1NZW4ncyBzaXplIDM1GAE6FgikxaMDEMnGowMYgaM-IAEomodGMABY86cgYAJqFwjXh54DEIGjPhoI1s-dA8mGngMgmodGaisIpMWjAxCBoz4aHPTEowOoxaMD9cSjA8jGowP2xKMDycajA6rFowMgmodG",
    //         },
    //         {
    //           text: "36",
    //           shoprs:
    //             "CAESCgoICJqHRhC-h0YYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyPQgBEgIzNiIKCggImodGEL6HRioRCg1NZW4ncyBzaXplIDM2GAE6FgikxaMDEKrFowMYgaM-IAEomodGMABY86cgYAJqFwjXh54DEIGjPhoI1s-dA8mGngMgmodGaisIpMWjAxCBoz4aHPTEowOoxaMD9cSjA8jGowP2xKMDycajA6rFowMgmodG",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=men%27s+size+36+uniqlo+pleated+trousers&shoprs=CAESCgoICJqHRhC-h0YYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyPQgBEgIzNiIKCggImodGEL6HRioRCg1NZW4ncyBzaXplIDM2GAE6FgikxaMDEKrFowMYgaM-IAEomodGMABY86cgYAJqFwjXh54DEIGjPhoI1s-dA8mGngMgmodGaisIpMWjAxCBoz4aHPTEowOoxaMD9cSjA8jGowP2xKMDycajA6rFowMgmodG",
    //         },
    //       ],
    //     },
    //     {
    //       type: "Product Rating",
    //       input_type: "link",
    //       options: [
    //         {
    //           text: "4 and up",
    //           shoprs:
    //             "CAESBWIDCJADGB4qF3VuaXFsbyBwbGVhdGVkIHRyb3VzZXJzMhUIHhIINCBhbmQgdXAiBWIDCJADQARgAg",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=Uniqlo+Pleated+Trousers&shoprs=CAESBWIDCJADGB4qF3VuaXFsbyBwbGVhdGVkIHRyb3VzZXJzMhUIHhIINCBhbmQgdXAiBWIDCJADQARgAg",
    //         },
    //       ],
    //     },
    //     {
    //       type: "Closure Type",
    //       input_type: "checkbox",
    //       options: [
    //         {
    //           text: "Hook & Eye",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyHAgBEgpIb29rICYgRXllOgwIt6_HAxDXpMcDMABY86cgYAI",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=hook+%26+eye+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyHAgBEgpIb29rICYgRXllOgwIt6_HAxDXpMcDMABY86cgYAI",
    //         },
    //         {
    //           text: "Snap",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFggBEgRTbmFwOgwIt6_HAxClj8cDMABY86cgYAI",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=snap+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFggBEgRTbmFwOgwIt6_HAxClj8cDMABY86cgYAI",
    //         },
    //       ],
    //     },
    //     {
    //       type: "Free shipping",
    //       input_type: "link",
    //       options: [
    //         {
    //           text: "Free shipping",
    //           shoprs:
    //             "CAESBFICEAEYGSoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFwgZEg1GcmVlIHNoaXBwaW5nIgRSAhABYAI",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=Uniqlo+Pleated+Trousers+free+shipping&shoprs=CAESBFICEAEYGSoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFwgZEg1GcmVlIHNoaXBwaW5nIgRSAhABYAI",
    //         },
    //       ],
    //     },
    //     {
    //       type: "Brand",
    //       input_type: "checkbox",
    //       options: [
    //         {
    //           text: "Gap",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyEwgBEgNHYXA6CgiD8zwQ8OQ9MAFY86cgYAI",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=gap+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyEwgBEgNHYXA6CgiD8zwQ8OQ9MAFY86cgYAI",
    //         },
    //         {
    //           text: "Loup",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFggBEgRMb3VwOgwIg_M8EJyL-90DMAFY86cgYAI",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=loup+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFggBEgRMb3VwOgwIg_M8EJyL-90DMAFY86cgYAI",
    //         },
    //         {
    //           text: "Fashion Nova",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyHQgBEgxGYXNoaW9uIE5vdmE6CwiD8zwQ7e-gATABWPOnIGAC",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=fashion+nova+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyHQgBEgxGYXNoaW9uIE5vdmE6CwiD8zwQ7e-gATABWPOnIGAC",
    //         },
    //         {
    //           text: "ZARA",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFAgBEgRaQVJBOgoIg_M8EI26PjABWPOnIGAC",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=zara+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFAgBEgRaQVJBOgoIg_M8EI26PjABWPOnIGAC",
    //         },
    //       ],
    //     },
    //     {
    //       type: "Carousel Filters",
    //       options: [
    //         {
    //           text: "Men's",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFQgBEgVNZW4nczoKCICjPhCBoz4wBVjzpyBgAQ",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=men%27s+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFQgBEgVNZW4nczoKCICjPhCBoz4wBVjzpyBgAQ",
    //           input_type: "checkbox",
    //         },
    //         {
    //           text: "Women's",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFwgBEgdXb21lbidzOgoIgKM-EIKjPjAFWPOnIGAB",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=women%27s+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFwgBEgdXb21lbidzOgoIgKM-EIKjPjAFWPOnIGAB",
    //           input_type: "checkbox",
    //         },
    //         {
    //           text: "Wide Leg",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGggBEghXaWRlIExlZzoMCIKAgwEQiICDATAAWPOnIGAB",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=wide+leg+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGggBEghXaWRlIExlZzoMCIKAgwEQiICDATAAWPOnIGAB",
    //           input_type: "checkbox",
    //         },
    //         {
    //           text: "Black",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFwgBEgVCbGFjazoMCNiM9QEQ5Yr1ATALWPOnIGAB",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=black+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFwgBEgVCbGFjazoMCNiM9QEQ5Yr1ATALWPOnIGAB",
    //           input_type: "color",
    //         },
    //         {
    //           text: "Gray",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFggBEgRHcmF5OgwI2Iz1ARDqivUBMAtY86cgYAE",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=gray+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFggBEgRHcmF5OgwI2Iz1ARDqivUBMAtY86cgYAE",
    //           input_type: "color",
    //         },
    //         {
    //           text: "With Pockets",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyIAgBEgxXaXRoIFBvY2tldHMYAjoMCLXapAMQ2dykAzADWPOnIGAB",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=uniqlo+pleated+trousers+with+pockets&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyIAgBEgxXaXRoIFBvY2tldHMYAjoMCLXapAMQ2dykAzADWPOnIGAB",
    //           input_type: "checkbox",
    //         },
    //         {
    //           text: "Brown",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFwgBEgVCcm93bjoMCNiM9QEQ64r1ATALWPOnIGAB",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=brown+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFwgBEgVCcm93bjoMCNiM9QEQ64r1ATALWPOnIGAB",
    //           input_type: "color",
    //         },
    //         {
    //           text: "Navy Blue",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGwgBEglOYXZ5IEJsdWU6DAjYjPUBEIeM9QEwC1jzpyBgAQ",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=navy+blue+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGwgBEglOYXZ5IEJsdWU6DAjYjPUBEIeM9QEwC1jzpyBgAQ",
    //           input_type: "color",
    //         },
    //         {
    //           text: "High Rise",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGwgBEglIaWdoIFJpc2U6DAjNvJ4BEM68ngEwAFjzpyBgAQ",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=high+rise+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGwgBEglIaWdoIFJpc2U6DAjNvJ4BEM68ngEwAFjzpyBgAQ",
    //           input_type: "checkbox",
    //         },
    //         {
    //           text: "Blue",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFggBEgRCbHVlOgwI2Iz1ARDmivUBMAtY86cgYAE",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=blue+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFggBEgRCbHVlOgwI2Iz1ARDmivUBMAtY86cgYAE",
    //           input_type: "link",
    //         },
    //         {
    //           text: "Relaxed Fit",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyHQgBEgtSZWxheGVkIEZpdDoMCMe8ngEQybyeATAAWPOnIGAB",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=relaxed+fit+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyHQgBEgtSZWxheGVkIEZpdDoMCMe8ngEQybyeATAAWPOnIGAB",
    //           input_type: "link",
    //         },
    //         {
    //           text: "Dress Pants",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGwgBEgtEcmVzcyBQYW50czoKCPv9ORD9_TkwAljzpyBgAQ",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=dress+pants+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGwgBEgtEcmVzcyBQYW50czoKCPv9ORD9_TkwAljzpyBgAQ",
    //           input_type: "checkbox",
    //         },
    //         {
    //           text: "On sale",
    //           shoprs:
    //             "CAESBEoCGAEYBioXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyEwgGEgdPbiBzYWxlGAIiBEoCGAFY86cgYAE",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=Uniqlo+Pleated+Trousers+sale&shoprs=CAESBEoCGAEYBioXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyEwgGEgdPbiBzYWxlGAIiBEoCGAFY86cgYAE",
    //           input_type: "link_with_icon",
    //         },
    //         {
    //           text: "Cargo Pants",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGwgBEgtDYXJnbyBQYW50czoKCPv9ORD8_TkwAljzpyBgAQ",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=cargo+pants+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGwgBEgtDYXJnbyBQYW50czoKCPv9ORD8_TkwAljzpyBgAQ",
    //           input_type: "checkbox",
    //         },
    //         {
    //           text: "Cropped",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGQgBEgdDcm9wcGVkOgwIgsGfARCDwZ8BMANY86cgYAE",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=cropped+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGQgBEgdDcm9wcGVkOgwIgsGfARCDwZ8BMANY86cgYAE",
    //           input_type: "checkbox",
    //         },
    //         {
    //           text: "Ankle",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFwgBEgVBbmtsZToMCPHAnwEQ8sCfATAAWPOnIGAB",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=ankle+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFwgBEgVBbmtsZToMCPHAnwEQ8sCfATAAWPOnIGAB",
    //           input_type: "link",
    //         },
    //         {
    //           text: "Petite",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGAgBEgZQZXRpdGU6DAiH97QCEIr3tAIwAFjzpyBgAQ",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=petite+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGAgBEgZQZXRpdGU6DAiH97QCEIr3tAIwAFjzpyBgAQ",
    //           input_type: "checkbox",
    //         },
    //         {
    //           text: "Straight Leg",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyHggBEgxTdHJhaWdodCBMZWc6DAiCgIMBEIeAgwEwAFjzpyBgAQ",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=straight+leg+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyHggBEgxTdHJhaWdodCBMZWc6DAiCgIMBEIeAgwEwAFjzpyBgAQ",
    //           input_type: "checkbox",
    //         },
    //         {
    //           text: "Corduroy Pants",
    //           shoprs:
    //             "CAEYCSoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyEggJEg5Db3JkdXJveSBQYW50c2AB",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=corduroy+pants+uniqlo+pleated+trousers&shoprs=CAEYCSoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyEggJEg5Db3JkdXJveSBQYW50c2AB",
    //           input_type: "link",
    //         },
    //         {
    //           text: "Plaid",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFQgBEgVQbGFpZDoKCPGFPhD5hT4wAFjzpyBgAQ",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=plaid+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFQgBEgVQbGFpZDoKCPGFPhD5hT4wAFjzpyBgAQ",
    //           input_type: "checkbox",
    //         },
    //         {
    //           text: "Striped",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFwgBEgdTdHJpcGVkOgoI8YU-EPKFPjAAWPOnIGAB",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=striped+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFwgBEgdTdHJpcGVkOgoI8YU-EPKFPjAAWPOnIGAB",
    //           input_type: "checkbox",
    //         },
    //         {
    //           text: "Mid Rise",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGggBEghNaWQgUmlzZToMCM28ngEQ5cCfATAAWPOnIGAB",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=mid+rise+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGggBEghNaWQgUmlzZToMCM28ngEQ5cCfATAAWPOnIGAB",
    //           input_type: "checkbox",
    //         },
    //         {
    //           text: "Cotton",
    //           shoprs:
    //             "CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFggBEgZDb3R0b246Cgj2kmMQ_5JjMABY86cgYAE",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=cotton+uniqlo+pleated+trousers&shoprs=CAEYASoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyFggBEgZDb3R0b246Cgj2kmMQ_5JjMABY86cgYAE",
    //           input_type: "checkbox",
    //         },
    //         {
    //           text: "Kids' Pants & Leggings",
    //           shoprs:
    //             "CAEYCSoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGggJEhZLaWRzJyBQYW50cyAmIExlZ2dpbmdzYAE",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=kids%27+pants+%26+leggings+uniqlo+pleated+trousers&shoprs=CAEYCSoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyGggJEhZLaWRzJyBQYW50cyAmIExlZ2dpbmdzYAE",
    //           input_type: "link",
    //         },
    //         {
    //           text: "Under $25",
    //           shoprs:
    //             "CAESDRILEQAAAACE13dBGAEYBSoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyIggFEglVbmRlciAkMjUYAiINEgsRAAAAAITXd0EYASoCGAFY86cgYAE",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=Uniqlo+Pleated+Trousers+under+%2425&shoprs=CAESDRILEQAAAACE13dBGAEYBSoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyIggFEglVbmRlciAkMjUYAiINEgsRAAAAAITXd0EYASoCGAFY86cgYAE",
    //           input_type: "price_range",
    //         },
    //         {
    //           text: "Chinos & Khakis",
    //           shoprs:
    //             "CAEYCSoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyEwgJEg9DaGlub3MgJiBLaGFraXNgAQ",
    //           serpapi_link:
    //             "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=chinos+%26+khakis+uniqlo+pleated+trousers&shoprs=CAEYCSoXdW5pcWxvIHBsZWF0ZWQgdHJvdXNlcnMyEwgJEg9DaGlub3MgJiBLaGFraXNgAQ",
    //           input_type: "link",
    //         },
    //       ],
    //     },
    //   ],
    //   serpapi_pagination: {
    //     next: "https://serpapi.com/search.json?device=desktop&engine=google_shopping&gl=us&google_domain=google.com&hl=en&num=5&q=Uniqlo+Pleated+Trousers&start=10",
    //   },
    // };

    // -----------------------------------------------
    // The JSON payload contains `shopping_results` which is an array
    // of objects, each one has `title`, `link`, `price`, `source`.
    // -----------------------------------------------
    const results: SerpShoppingResult[] = (data.shopping_results ?? [])
      .slice(0, 5)
      .map((r: any) => ({
        title: r.title ?? "",
        link: r.product_link ?? "",
        price: r.price ?? undefined,
        source: r.source ?? undefined,
        source_icon: r.source_icon ?? undefined,
        thumbnail: r.thumbnail ?? undefined,
        serpapi_thumbnail: r.serpapi_thumbnail ?? undefined,
        delivery: r.delivery ?? undefined,
      }));

    return results;
  } catch (err: any) {
    console.error("🚨 SerpAPI request failed:", err?.response?.data ?? err);
    // On any error we return an empty array – the caller can decide
    // whether to keep the product without shopping URLs.
    return [];
  }
}
