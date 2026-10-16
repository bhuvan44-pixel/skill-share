"use strict";

const SkillBridgeCore = (() => {
  const LISTINGS_KEY = "skillbridge:listings:v1";
  const PROFILE_KEY = "skillbridge:profile:v1";
  const VISITOR_KEY = "skillbridge:visitor:v1";

  function read(key, fallback) {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }

  return { LISTINGS_KEY, PROFILE_KEY, VISITOR_KEY, read, write, makeId };
})();
