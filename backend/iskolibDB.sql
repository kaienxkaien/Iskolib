
Setting environment for using XAMPP for Windows.
Kaien@LAPTOP-TSLQPUMO c:\xampp
# mysql -u root
Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MariaDB connection id is 8
Server version: 10.4.32-MariaDB mariadb.org binary distribution

Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

MariaDB [(none)]> create database iskolib;
Query OK, 1 row affected (0.002 sec)

MariaDB [(none)]> show databases;
+--------------------+
| Database           |
+--------------------+
| db_exer3_reyes     |
| db_exer3_yam       |
| db_jacbookstore    |
| dbexer1_reyes      |
| dbexer1_yam        |
| information_schema |
| iskolib            |
| mysql              |
| performance_schema |
| phpmyadmin         |
| test               |
+--------------------+
11 rows in set (0.061 sec)

MariaDB [(none)]> use iskolib;
Database changed
MariaDB [iskolib]> create table users (
    -> id int auto_increment primary key,
    -> student_id varchar(30) unique,
    -> full_name varchar(120) not null,
    -> username varchar(60) not null unique,
    -> password varchar(255) not null,
    -> role ENUM('admin', 'student') default 'student',
    -> course varchar(120),
    -> is_active boolean default true,
    -> created_at timestamp default current_timestamp
    -> );
Query OK, 0 rows affected (0.036 sec)

MariaDB [iskolib]> select * from users;
Empty set (0.051 sec)

MariaDB [iskolib]> create table books (
    -> id int auto_increment primary key,
    -> isbn varchar(20),
    -> title varchar(150) not null,
    -> author varchar(100) not null,
    -> genre varchar(50),
    -> total_copies int default 0,
    -> available_copies int default 0
    -> );
Query OK, 0 rows affected (0.016 sec)

MariaDB [iskolib]> drop table users;
Query OK, 0 rows affected (0.005 sec)

MariaDB [iskolib]> show tables
    -> ;
+-------------------+
| Tables_in_iskolib |
+-------------------+
| books             |
+-------------------+
1 row in set (0.001 sec)

MariaDB [iskolib]> create users (
    -> id auto_increment primary_key,
    -> student_id varchar(30) unique,
    -> full_name varchar(100) not null,
    -> username varchar(50) unique not null,
    -> password varchar(255) not null,
    -> role enum('admin', 'student') default 'student',
    -> course varchar(100),
    -> is_active boolean default true
    -> );
ERROR 1064 (42000): You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near'users (
id auto_increment primary_key,
student_id varchar(30) unique,
full_na...' at line 1
MariaDB [iskolib]> create table users (
    -> id auto_increment primary_key,
    -> student_id varchar(30) unique,
    -> full_name varchar(100) not null,
    -> username varchar(50) unique not null,
    -> password varchar(255) not null,
    -> role enum('admin', 'student') default 'student',
    -> course varchar(100),
    -> is_active boolean default true
    -> );
ERROR 1064 (42000): You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near'primary_key,
student_id varchar(30) unique,
full_name varchar(100) not null,
...' at line 2
MariaDB [iskolib]> create table users (
    -> id int auto_increment primary_key,
    -> student_id varchar(30) unique,
    -> full_name varchar(100) not null,
    -> username varchar(50) unique not null,
    -> password varchar(255) not null,
    -> role enum('admin', 'student') default 'student',
    -> course varchar(100),
    -> is_active boolean default true
    -> );
ERROR 1064 (42000): You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near'
student_id varchar(30) unique,
full_name varchar(100) not null,
username var...' at line 2
MariaDB [iskolib]> create table users (
    -> id int auto_increment primary key,
    -> student_id varchar(30) UNIQUE,
    -> full_name varchar(100) NOT NULL,
    -> username varchar(50) UNIQUE NOT NULL,
    -> password varchar(255) NOT NULL,
    -> role ENUM('admin', 'student') default 'student',
    -> course varchar(100),
    -> is_active boolean default TRUE
    -> );
Query OK, 0 rows affected (0.025 sec)

MariaDB [iskolib]> create table loans (
    -> id int auto_increment primary key,
    -> user_id int not null,
    -> book_id int not null,
    -> quantity int default 1,
    -> borrowed_at DATETIME default current_timestamp,
    -> due_date DATE not null,
    -> returned_at DATETIME NULL,
    -> status ENUM('borrowed', 'returned_requested', 'returned') default 'borrowed,
    '> FOREIGN KEY (user_id) references users(id),
    '> FOREIGN KEY (book_id) references books(id)
    '> );
    '> '
    -> Bye

Kaien@LAPTOP-TSLQPUMO c:\xampp
# mysql -u root
Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MariaDB connection id is 9
Server version: 10.4.32-MariaDB mariadb.org binary distribution

Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

MariaDB [(none)]> use iskolob;
ERROR 1049 (42000): Unknown database 'iskolob'
MariaDB [(none)]> use iskolib;
Database changed
MariaDB [iskolib]> create table loans (
    -> id int auto_increment primary key,
    -> user_id int not null,
    -> book_id int not null,
    -> quantity int default 1,
    -> borrowed_at DATETIME default current_timestamp,
    -> due_date DATE not null,
    -> returned_at DATETIME NULL,
    -> status ENUM('borrowed', 'returned_requested', 'returned') default 'borrowed',
    -> FOREIGN KEY (user_id) references users(id),
    -> FOREIGN KEY (book_id) references books(id)
    -> );
Query OK, 0 rows affected (0.026 sec)

MariaDB [iskolib]> show tables;
+-------------------+
| Tables_in_iskolib |
+-------------------+
| books             |
| loans             |
| users             |
+-------------------+
3 rows in set (0.001 sec)

MariaDB [iskolib]> insert into books (
    -> isbn, title, author, genre, total_copies, available_copies)
    -> values (
    -> '1001', 'Noli Me Tangere', 'Jose Rizal', 'Filipiniana', 24, 24),
    -> ('1002', 'The Sociological Imagnation', 'C. Wright Mills', 'Social Sciences', 12, 12),
    -> ('1003', 'The Design of Everyday Things', 'Don Norman', 'Technology', 8,8),
    -> ('1004', 'Pedagogy of the Oppressed', 'Paulo Freire', 'Education', 16, 16),
    -> ('1005', 'Ways of Seeing', 'John Berger', 'Fine Arts', 5, 5);
Query OK, 5 rows affected (0.011 sec)
Records: 5  Duplicates: 0  Warnings: 0

MariaDB [iskolib]> select * from books;
+----+------+-------------------------------+-----------------+-----------------+--------------+------------------+
| id | isbn | title                         | author          | genre           | total_copies | available_copies |
+----+------+-------------------------------+-----------------+-----------------+--------------+------------------+
|  1 | 1001 | Noli Me Tangere               | Jose Rizal      | Filipiniana     |           24 |               24 |
|  2 | 1002 | The Sociological Imagnation   | C. Wright Mills | Social Sciences |           12 |               12 |
|  3 | 1003 | The Design of Everyday Things | Don Norman      | Technology      |            8 |                8 |
|  4 | 1004 | Pedagogy of the Oppressed     | Paulo Freire    | Education       |           16 |               16 |
|  5 | 1005 | Ways of Seeing                | John Berger     | Fine Arts       |            5 |                5 |
+----+------+-------------------------------+-----------------+-----------------+--------------+------------------+
5 rows in set (0.000 sec)

MariaDB [iskolib]> insert into users (student_id, full_name,username, password, role, course) values (
    -> '2024-00362-PQ-0', 'Jhaycee Reyes', 'jhaycee@iskolib.com', 'admin123', 'admin', 'BSIT')
    -> ;
Query OK, 1 row affected (0.003 sec)

MariaDB [iskolib]> select * from users;
+----+-----------------+---------------+---------------------+----------+-------+--------+-----------+
| id | student_id      | full_name     | username            | password | role  | course | is_active |
+----+-----------------+---------------+---------------------+----------+-------+--------+-----------+
|  1 | 2024-00362-PQ-0 | Jhaycee Reyes | jhaycee@iskolib.com | admin123 | admin | BSIT   |         1 |
+----+-----------------+---------------+---------------------+----------+-------+--------+-----------+
1 row in set (0.000 sec)

MariaDB [iskolib]>
