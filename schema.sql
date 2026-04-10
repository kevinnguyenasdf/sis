CREATE TABLE IF NOT EXISTS MAJOR (
  major_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  department VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS STUDENT (
  student_id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  grade_level VARCHAR(20) DEFAULT 'Freshman',
  total_units INT DEFAULT 0,
  major_id INT,
  FOREIGN KEY (major_id) REFERENCES MAJOR(major_id)
);

CREATE TABLE IF NOT EXISTS PROFESSOR (
  professor_id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS ADMIN (
  admin_id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS COURSE (
  course_id SERIAL PRIMARY KEY,
  course_code VARCHAR(20) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  units INT NOT NULL DEFAULT 3,
  department_id INT
);

CREATE TABLE IF NOT EXISTS PREREQUISITE (
  prereq_id SERIAL PRIMARY KEY,
  course_id INT NOT NULL,
  required_course_id INT NOT NULL,
  FOREIGN KEY (course_id) REFERENCES COURSE(course_id),
  FOREIGN KEY (required_course_id) REFERENCES COURSE(course_id)
);

CREATE TABLE IF NOT EXISTS SEMESTER (
  semester_id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  season VARCHAR(20) NOT NULL,
  year INT NOT NULL,
  drop_deadline DATE,
  start_date DATE,
  end_date DATE
);

CREATE TABLE IF NOT EXISTS SECTION (
  section_id SERIAL PRIMARY KEY,
  course_id INT NOT NULL,
  professor_id INT NOT NULL,
  semester_id INT NOT NULL,
  room VARCHAR(50),
  schedule VARCHAR(100),
  max_seats INT NOT NULL DEFAULT 30,
  enrolled_count INT DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES COURSE(course_id),
  FOREIGN KEY (professor_id) REFERENCES PROFESSOR(professor_id),
  FOREIGN KEY (semester_id) REFERENCES SEMESTER(semester_id)
);

CREATE TABLE IF NOT EXISTS ENROLLMENT (
  enrollment_id SERIAL PRIMARY KEY,
  student_id INT NOT NULL,
  section_id INT NOT NULL,
  status VARCHAR(20) DEFAULT 'enrolled',
  grade VARCHAR(5),
  enrolled_at DATE,
  FOREIGN KEY (student_id) REFERENCES STUDENT(student_id),
  FOREIGN KEY (section_id) REFERENCES SECTION(section_id)
);

CREATE TABLE IF NOT EXISTS DEGREE_REQUIREMENT (
  req_id SERIAL PRIMARY KEY,
  major_id INT NOT NULL,
  course_id INT NOT NULL,
  FOREIGN KEY (major_id) REFERENCES MAJOR(major_id),
  FOREIGN KEY (course_id) REFERENCES COURSE(course_id)
);

CREATE TABLE IF NOT EXISTS TRANSCRIPT (
  transcript_id SERIAL PRIMARY KEY,
  student_id INT NOT NULL,
  admin_id INT NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (student_id) REFERENCES STUDENT(student_id),
  FOREIGN KEY (admin_id) REFERENCES ADMIN(admin_id)
);
