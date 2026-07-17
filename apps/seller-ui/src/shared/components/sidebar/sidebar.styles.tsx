//Path: apps/seller-ui/src/shared/components/sidebar/sidebar.styles.tsx
"use client";
import styled from "styled-components";

export const SidebarWrapper = styled.div<{ collapsed?: boolean }>`
  width: ${(props) => (props.collapsed ? "80px" : "260px")};
  height: 100vh;
  background: #ffffff;
  color: #292524;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  border-right: 1px solid #e7e5e4;
  transition: width 0.3s ease;
  overflow-x: hidden;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #d1fae5;
    border-radius: 999px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }

  @media (max-width: 768px) {
    width: ${(props) => (props.collapsed ? "0px" : "260px")};
    box-shadow: ${(props) =>
      props.collapsed ? "none" : "4px 0 20px -4px rgba(120,53,15,0.08)"};
  }
`;

export const Overlay = styled.div<{ collapsed?: boolean }>`
  display: ${(props) => (props.collapsed ? "none" : "block")};
  position: fixed;
  inset: 0;
  background: rgba(41, 37, 36, 0.4);
  z-index: 99;

  @media (min-width: 768px) {
    display: none;
  }
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px;
  border-bottom: 1px solid #e7e5e4;
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

export const Footer = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  border-top: 1px solid #e7e5e4;
  min-height: 64px;
  flex-shrink: 0;
  gap: 10px;
`;

export const Sidebar = {
  Wrapper: SidebarWrapper,
  Header,
  Body,
  Footer,
  Overlay,
};
