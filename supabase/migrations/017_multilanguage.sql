-- App translations (for UI, not content)
CREATE TABLE app_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL = global
  
  -- Translation key
  key TEXT NOT NULL,
  
  -- Translations
  en TEXT NOT NULL, -- English (default)
  es TEXT, -- Spanish
  fr TEXT, -- French
  de TEXT, -- German
  pt TEXT, -- Portuguese
  it TEXT, -- Italian
  
  -- Context for translators
  context TEXT,
  section TEXT, -- 'nav', 'forms', 'buttons', 'errors', etc.
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: key must be unique per company (or global if company_id is NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_translations_unique 
  ON app_translations (key, COALESCE(company_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE INDEX idx_app_translations_key ON app_translations(key);
CREATE INDEX idx_app_translations_section ON app_translations(section);

-- User language preferences
CREATE TABLE user_language_prefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  language TEXT NOT NULL DEFAULT 'en', -- 'en', 'es', 'fr', 'de', 'pt', 'it'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Triggers
CREATE TRIGGER app_translations_updated_at
  BEFORE UPDATE ON app_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER user_language_prefs_updated_at
  BEFORE UPDATE ON user_language_prefs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE app_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_language_prefs ENABLE ROW LEVEL SECURITY;

-- Everyone can read translations
CREATE POLICY "Everyone can read translations"
  ON app_translations FOR SELECT
  USING (true);

-- Admins can manage translations
CREATE POLICY "Admins can manage translations"
  ON app_translations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'company_admin')
    )
  );

-- Users can manage own language pref
CREATE POLICY "Users can manage own language pref"
  ON user_language_prefs FOR ALL
  USING (user_id = auth.uid());

-- Insert default English translations
INSERT INTO app_translations (key, en, es, section) VALUES
-- Navigation
('nav.dashboard', 'Dashboard', 'Panel', 'nav'),
('nav.tours', 'Tours', 'Excursiones', 'nav'),
('nav.guides', 'Guides', 'Guías', 'nav'),
('nav.vehicles', 'Vehicles', 'Vehículos', 'nav'),
('nav.guests', 'Guests', 'Huéspedes', 'nav'),
('nav.reports', 'Reports', 'Reportes', 'nav'),
('nav.settings', 'Settings', 'Configuración', 'nav'),

-- Common buttons
('btn.save', 'Save', 'Guardar', 'buttons'),
('btn.cancel', 'Cancel', 'Cancelar', 'buttons'),
('btn.delete', 'Delete', 'Eliminar', 'buttons'),
('btn.edit', 'Edit', 'Editar', 'buttons'),
('btn.create', 'Create', 'Crear', 'buttons'),
('btn.search', 'Search', 'Buscar', 'buttons'),
('btn.filter', 'Filter', 'Filtrar', 'buttons'),
('btn.export', 'Export', 'Exportar', 'buttons'),
('btn.print', 'Print', 'Imprimir', 'buttons'),

-- Form labels
('form.email', 'Email', 'Correo', 'forms'),
('form.password', 'Password', 'Contraseña', 'forms'),
('form.name', 'Name', 'Nombre', 'forms'),
('form.phone', 'Phone', 'Teléfono', 'forms'),
('form.date', 'Date', 'Fecha', 'forms'),
('form.time', 'Time', 'Hora', 'forms'),
('form.status', 'Status', 'Estado', 'forms'),

-- Errors
('error.required', 'This field is required', 'Este campo es obligatorio', 'errors'),
('error.invalid_email', 'Invalid email address', 'Correo inválido', 'errors'),
('error.unauthorized', 'You are not authorized', 'No autorizado', 'errors'),
('error.not_found', 'Not found', 'No encontrado', 'errors');
