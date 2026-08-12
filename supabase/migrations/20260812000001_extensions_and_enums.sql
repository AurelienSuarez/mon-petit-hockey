-- Extensions
create extension if not exists pgcrypto;

-- Enums
create type gender as enum ('M', 'F');
create type match_stage as enum ('round1', 'crossgroup', 'ranking', 'semifinal', 'third_place', 'final');
create type match_status as enum ('scheduled', 'finished');
create type venue as enum ('wavre', 'amstelveen');
create type league_role as enum ('owner', 'member');
create type shootout_winner as enum ('home', 'away');
