import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const db = globalThis.__B44_DB__ || { entities: new Proxy({}, { get: () => ({ list: async () => [] }) }) };

const PropertyContext = createContext(null);

const STORAGE_KEY = 'hostera_selected_property_id';

export function PropertyProvider({ children }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.entities.Property.list();
      setProperties(data || []);
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // If the previously-selected property no longer exists (deleted, or
  // switched organizations), fall back cleanly instead of pointing at
  // nothing.
  useEffect(() => {
    if (!loading && selectedPropertyId && !properties.some(p => p.id === selectedPropertyId)) {
      setSelectedPropertyId(null);
    }
  }, [loading, properties, selectedPropertyId]);

  const selectProperty = useCallback((id) => {
    setSelectedPropertyId(id);
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage errors (private browsing, etc.)
    }
  }, []);

  const selectedProperty = selectedPropertyId
    ? properties.find(p => p.id === selectedPropertyId) || null
    : null;

  // Pages read `scopeIds` to know which property_id(s) their query should
  // match: a single id when one property is selected, every known id when
  // "All Properties" is selected (undefined/null before properties load,
  // so pages can tell "not ready" apart from "no properties exist").
  const scopeIds = loading ? undefined : (selectedProperty ? [selectedProperty.id] : properties.map(p => p.id));

  return (
    <PropertyContext.Provider
      value={{
        properties,
        loading,
        selectedProperty,
        selectedPropertyId,
        selectProperty,
        scopeIds,
        refreshProperties: refresh,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  const ctx = useContext(PropertyContext);
  if (!ctx) {
    throw new Error('useProperty() must be used within a <PropertyProvider>');
  }
  return ctx;
}
