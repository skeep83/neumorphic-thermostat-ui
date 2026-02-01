export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: {
    [key: string]: any;
    friendly_name?: string;
    unit_of_measurement?: string;
    min_temp?: number;
    max_temp?: number;
    current_temperature?: number;
    temperature?: number;
    target_temp_step?: number;
    hvac_modes?: string[];
    preset_mode?: string;
    preset_modes?: string[];
    fan_mode?: string;
    fan_modes?: string[];
    hvac_action?: string;
  };
  last_changed: string;
  last_updated: string;
  context: {
    id: string;
    user_id: string | null;
  };
}

export interface HomeAssistant {
  auth: any;
  connection: any;
  connected: boolean;
  states: { [entity_id: string]: HassEntity };
  services: any;
  config: any;
  themes: any;
  selectedTheme?: string | null;
  callService: (
    domain: string,
    service: string,
    serviceData?: Record<string, any>
  ) => Promise<void>;
  callApi: (
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    parameters?: Record<string, any>
  ) => Promise<any>;
}

export interface LovelaceCardConfig {
  type: string;
  entity?: string;
  name?: string;
  [key: string]: any;
}

export interface LovelaceCard extends HTMLElement {
  hass?: HomeAssistant;
  setConfig(config: LovelaceCardConfig): void;
}
