"use client";
import { createContext, useContext } from 'react';

const ProfileContext = createContext({
    profile: null,
    loading: true,
    refreshProfile: () => { },
    isOwner: false,
});

export const useProfile = () => useContext(ProfileContext);

export default ProfileContext;
