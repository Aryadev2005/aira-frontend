const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useLocation } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';

export default function PageNotFound({}) {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await db.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });
    
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="max-w-md w-full">
                <div className="text-center space-y-6">
                    {/* 404 Error Code */}
                    <div className="space-y-2">
                        <span className="font-heading text-2xl text-primary">AIRA</span>
                        <h1 className="text-7xl font-heading text-muted-foreground/30">404</h1>
                        <div className="h-0.5 w-16 bg-border mx-auto"></div>
                    </div>
                    
                    {/* Main Message */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-heading text-foreground">
                            Page Not Found
                        </h2>
                        <p className="text-muted-foreground font-body leading-relaxed">
                            The page <span className="font-medium text-foreground">"{pageName}"</span> doesn't exist yet.
                        </p>
                    </div>
                    
                    {/* Admin Note */}
                    {isFetched && authData.isAuthenticated && authData.user?.role === 'admin' && (
                        <div className="mt-8 p-4 bg-card rounded-xl border border-border">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                </div>
                                <div className="text-left space-y-1">
                                    <p className="text-sm font-body font-medium text-foreground">Admin Note</p>
                                    <p className="text-sm font-body text-muted-foreground leading-relaxed">
                                        This page hasn't been built yet. Ask the AI to implement it in the chat.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Action Button */}
                    <div className="pt-6">
                        <button 
                            onClick={() => window.location.href = '/'} 
                            className="inline-flex items-center px-6 py-2.5 text-sm font-body font-semibold text-primary-foreground bg-primary rounded-pill hover:bg-primary/90 transition-colors shadow-warm"
                        >
                            Go Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}