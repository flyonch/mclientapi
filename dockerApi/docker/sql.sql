CREATE TABLE userRole (
  user_role_id serial PRIMARY KEY,
  user_role_name VARCHAR(20)
);

CREATE TABLE users (
  user_id serial PRIMARY KEY,
  user_fullname VARCHAR(50),
  user_phone VARCHAR(20) NOT NULL,
  user_email VARCHAR(255) UNIQUE NOT NULL,
  user_password VARCHAR(255) NOT NULL,
  isActivated BOOLEAN NOT NULL,
  activationLink VARCHAR(255),
  userRole INT REFERENCES userRole(user_role_id) default 3,
  avatarURL VARCHAR(255),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE tokens (
  token_id serial PRIMARY KEY,
  user_id INT,
  refreshToken VARCHAR(255),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_tokens_user_id FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE managers (
  manager_id serial PRIMARY KEY,
  manager_fullname VARCHAR(50),
  manager_phone VARCHAR(20) NOT NULL,
  manager_email VARCHAR(255) UNIQUE NOT NULL,
  manager_password VARCHAR(255) NOT NULL,
  isActivated BOOLEAN NOT NULL,
  activationLink VARCHAR(255),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE type_services (
  type_services_id serial PRIMARY KEY,
  type_service_name VARCHAR(50),
  url_image VARCHAR(254)
);

CREATE TABLE services (
  service_id serial PRIMARY KEY,
  type_services_id INT,
  name_service VARCHAR(50),
  description VARCHAR(200),
  price VARCHAR(50),
  duration interval,
  
  constraint fk_type_services_id FOREIGN KEY (type_services_id) REFERENCES type_services(type_services_id)
);

CREATE TABLE schedule (
  schedule_id serial PRIMARY KEY,
  manager_id INT,
  day_of_week INT,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (manager_id, day_of_week),
  
  CONSTRAINT fk_schedule_manager_id FOREIGN KEY (manager_id) REFERENCES users(user_id)
);

CREATE TABLE manager_services (
  manager_service_id serial PRIMARY KEY,
  user_id INT,
  service_id INT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_manager_id FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_service_id FOREIGN KEY (service_id) REFERENCES services(service_id)
);

CREATE TABLE work_hours (
  work_hours_id serial PRIMARY KEY,
  manager_id INT,
  work_date DATE NOT NULL,
  work_hours_start TIME,
  work_hours_end TIME,
  busy BOOL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_work_hours_manager_id FOREIGN KEY (manager_id) REFERENCES users(user_id)
);

CREATE TABLE appointments (
  appointment_id serial4 NOT NULL,
  appointment_user_id int4 NOT NULL,
  appointment_manager_id int4 NOT NULL,
  service_id int4 NOT NULL,
  date_time_service timestamp NOT NULL,
  time_servce time not null,
  canceled bool NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  
  CONSTRAINT appointments_pkey PRIMARY KEY (appointment_id),
  CONSTRAINT fk_appointment_manager_id FOREIGN KEY (appointment_manager_id) REFERENCES public.users(user_id),
  CONSTRAINT fk_appointment_user_id FOREIGN KEY (appointment_user_id) REFERENCES public.users(user_id),
  CONSTRAINT fk_services_id FOREIGN KEY (service_id) REFERENCES public.services(service_id)
);



