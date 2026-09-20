CREATE TABLE people (
  id           serial PRIMARY KEY,
  name         text    NOT NULL,
  weekly_hours numeric NOT NULL
);

CREATE TABLE projects (
  id   serial PRIMARY KEY,
  name text   NOT NULL
);

CREATE TABLE assignments (
  id            serial PRIMARY KEY,
  person_id     int     NOT NULL REFERENCES people(id),
  project_id    int     NOT NULL REFERENCES projects(id),
  start_date    date    NOT NULL,
  end_date      date    NOT NULL,
  hours_per_day numeric NOT NULL
);

CREATE INDEX ON assignments (person_id);
CREATE INDEX ON assignments (start_date, end_date);
