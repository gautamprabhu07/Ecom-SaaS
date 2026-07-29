//Path: apps/admin-ui/src/shared/components/sidebar/sidebar.styles.tsx
"use client";
import styled from "styled-components";

export const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 20px 16px;
  border-bottom: 1px solid #262626;
  min-height: 64px;
  flex-shrink: 0;
`;

export const Body = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 12px 0;
  overflow-y: auto;
  gap: 2px;
`;

export const Sidebar = {
  Header,
  Body,
};
