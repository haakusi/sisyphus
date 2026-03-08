/**
 * Configuration Schema for Claude Sisyphus Plugin
 *
 * Defines the structure and validation for plugin configuration.
 */
import { z } from 'zod';
declare const AgentConfigSchema: z.ZodObject<{
    model: z.ZodDefault<z.ZodString>;
    temperature: z.ZodDefault<z.ZodNumber>;
    maxTokens: z.ZodDefault<z.ZodNumber>;
    thinkingBudget: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    thinkingBudget?: number;
}, {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    thinkingBudget?: number;
}>;
declare const AgentsConfigSchema: z.ZodObject<{
    sisyphus: z.ZodObject<{
        temperature: z.ZodDefault<z.ZodNumber>;
        maxTokens: z.ZodDefault<z.ZodNumber>;
    } & {
        model: z.ZodDefault<z.ZodString>;
        thinkingBudget: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        thinkingBudget?: number;
    }, {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        thinkingBudget?: number;
    }>;
    oracle: z.ZodObject<{
        temperature: z.ZodDefault<z.ZodNumber>;
        maxTokens: z.ZodDefault<z.ZodNumber>;
        thinkingBudget: z.ZodOptional<z.ZodNumber>;
    } & {
        model: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        thinkingBudget?: number;
    }, {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        thinkingBudget?: number;
    }>;
    librarian: z.ZodObject<{
        temperature: z.ZodDefault<z.ZodNumber>;
        maxTokens: z.ZodDefault<z.ZodNumber>;
        thinkingBudget: z.ZodOptional<z.ZodNumber>;
    } & {
        model: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        thinkingBudget?: number;
    }, {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        thinkingBudget?: number;
    }>;
    explorer: z.ZodObject<{
        temperature: z.ZodDefault<z.ZodNumber>;
        maxTokens: z.ZodDefault<z.ZodNumber>;
        thinkingBudget: z.ZodOptional<z.ZodNumber>;
    } & {
        model: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        thinkingBudget?: number;
    }, {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        thinkingBudget?: number;
    }>;
    prometheus: z.ZodObject<{
        temperature: z.ZodDefault<z.ZodNumber>;
        maxTokens: z.ZodDefault<z.ZodNumber>;
        thinkingBudget: z.ZodOptional<z.ZodNumber>;
    } & {
        model: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        thinkingBudget?: number;
    }, {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        thinkingBudget?: number;
    }>;
}, "strip", z.ZodTypeAny, {
    explorer?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        thinkingBudget?: number;
    };
    sisyphus?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        thinkingBudget?: number;
    };
    oracle?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        thinkingBudget?: number;
    };
    librarian?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        thinkingBudget?: number;
    };
    prometheus?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        thinkingBudget?: number;
    };
}, {
    explorer?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        thinkingBudget?: number;
    };
    sisyphus?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        thinkingBudget?: number;
    };
    oracle?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        thinkingBudget?: number;
    };
    librarian?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        thinkingBudget?: number;
    };
    prometheus?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        thinkingBudget?: number;
    };
}>;
declare const ConcurrencyConfigSchema: z.ZodObject<{
    maxParallel: z.ZodDefault<z.ZodNumber>;
    stallTimeout: z.ZodDefault<z.ZodNumber>;
    stabilityPolls: z.ZodDefault<z.ZodNumber>;
    stabilityInterval: z.ZodDefault<z.ZodNumber>;
    ttl: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    maxParallel?: number;
    stallTimeout?: number;
    stabilityPolls?: number;
    stabilityInterval?: number;
    ttl?: number;
}, {
    maxParallel?: number;
    stallTimeout?: number;
    stabilityPolls?: number;
    stabilityInterval?: number;
    ttl?: number;
}>;
declare const TodoEnforcerConfigSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    countdownSeconds: z.ZodDefault<z.ZodNumber>;
    minExecutionTime: z.ZodDefault<z.ZodNumber>;
    excludeAgents: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    enabled?: boolean;
    countdownSeconds?: number;
    minExecutionTime?: number;
    excludeAgents?: string[];
}, {
    enabled?: boolean;
    countdownSeconds?: number;
    minExecutionTime?: number;
    excludeAgents?: string[];
}>;
declare const HooksConfigSchema: z.ZodObject<{
    sessionStart: z.ZodDefault<z.ZodBoolean>;
    chatMessageBefore: z.ZodDefault<z.ZodBoolean>;
    toolExecuteBefore: z.ZodDefault<z.ZodBoolean>;
    toolExecuteAfter: z.ZodDefault<z.ZodBoolean>;
    sessionIdle: z.ZodDefault<z.ZodBoolean>;
    contextCompact: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    sessionStart?: boolean;
    chatMessageBefore?: boolean;
    toolExecuteBefore?: boolean;
    toolExecuteAfter?: boolean;
    sessionIdle?: boolean;
    contextCompact?: boolean;
}, {
    sessionStart?: boolean;
    chatMessageBefore?: boolean;
    toolExecuteBefore?: boolean;
    toolExecuteAfter?: boolean;
    sessionIdle?: boolean;
    contextCompact?: boolean;
}>;
declare const CredentialSchema: z.ZodObject<{
    accessToken: z.ZodOptional<z.ZodString>;
    refreshToken: z.ZodOptional<z.ZodString>;
    expiresAt: z.ZodOptional<z.ZodNumber>;
    apiKey: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    apiKey?: string;
}, {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    apiKey?: string;
}>;
declare const ExternalModelsConfigSchema: z.ZodObject<{
    google: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        credentials: z.ZodOptional<z.ZodObject<{
            accessToken: z.ZodOptional<z.ZodString>;
            refreshToken: z.ZodOptional<z.ZodString>;
            expiresAt: z.ZodOptional<z.ZodNumber>;
            apiKey: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            accessToken?: string;
            refreshToken?: string;
            expiresAt?: number;
            apiKey?: string;
        }, {
            accessToken?: string;
            refreshToken?: string;
            expiresAt?: number;
            apiKey?: string;
        }>>;
        defaultModel: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean;
        credentials?: {
            accessToken?: string;
            refreshToken?: string;
            expiresAt?: number;
            apiKey?: string;
        };
        defaultModel?: string;
    }, {
        enabled?: boolean;
        credentials?: {
            accessToken?: string;
            refreshToken?: string;
            expiresAt?: number;
            apiKey?: string;
        };
        defaultModel?: string;
    }>>;
    openai: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        credentials: z.ZodOptional<z.ZodObject<{
            accessToken: z.ZodOptional<z.ZodString>;
            refreshToken: z.ZodOptional<z.ZodString>;
            expiresAt: z.ZodOptional<z.ZodNumber>;
            apiKey: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            accessToken?: string;
            refreshToken?: string;
            expiresAt?: number;
            apiKey?: string;
        }, {
            accessToken?: string;
            refreshToken?: string;
            expiresAt?: number;
            apiKey?: string;
        }>>;
        defaultModel: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean;
        credentials?: {
            accessToken?: string;
            refreshToken?: string;
            expiresAt?: number;
            apiKey?: string;
        };
        defaultModel?: string;
    }, {
        enabled?: boolean;
        credentials?: {
            accessToken?: string;
            refreshToken?: string;
            expiresAt?: number;
            apiKey?: string;
        };
        defaultModel?: string;
    }>>;
    azure: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        credentials: z.ZodOptional<z.ZodObject<{
            accessToken: z.ZodOptional<z.ZodString>;
            refreshToken: z.ZodOptional<z.ZodString>;
            expiresAt: z.ZodOptional<z.ZodNumber>;
            apiKey: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            accessToken?: string;
            refreshToken?: string;
            expiresAt?: number;
            apiKey?: string;
        }, {
            accessToken?: string;
            refreshToken?: string;
            expiresAt?: number;
            apiKey?: string;
        }>>;
        endpoint: z.ZodOptional<z.ZodString>;
        defaultModel: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean;
        credentials?: {
            accessToken?: string;
            refreshToken?: string;
            expiresAt?: number;
            apiKey?: string;
        };
        defaultModel?: string;
        endpoint?: string;
    }, {
        enabled?: boolean;
        credentials?: {
            accessToken?: string;
            refreshToken?: string;
            expiresAt?: number;
            apiKey?: string;
        };
        defaultModel?: string;
        endpoint?: string;
    }>>;
    autoDelegation: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        frontendToGemini: z.ZodDefault<z.ZodBoolean>;
        strategyToGpt: z.ZodDefault<z.ZodBoolean>;
        codeToCodex: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean;
        frontendToGemini?: boolean;
        strategyToGpt?: boolean;
        codeToCodex?: boolean;
    }, {
        enabled?: boolean;
        frontendToGemini?: boolean;
        strategyToGpt?: boolean;
        codeToCodex?: boolean;
    }>>;
}, "strip", z.ZodTypeAny, {
    google?: {
        enabled?: boolean;
        credentials?: {
            accessToken?: string;
            refreshToken?: string;
            expiresAt?: number;
            apiKey?: string;
        };
        defaultModel?: string;
    };
    openai?: {
        enabled?: boolean;
        credentials?: {
            accessToken?: string;
            refreshToken?: string;
            expiresAt?: number;
            apiKey?: string;
        };
        defaultModel?: string;
    };
    azure?: {
        enabled?: boolean;
        credentials?: {
            accessToken?: string;
            refreshToken?: string;
            expiresAt?: number;
            apiKey?: string;
        };
        defaultModel?: string;
        endpoint?: string;
    };
    autoDelegation?: {
        enabled?: boolean;
        frontendToGemini?: boolean;
        strategyToGpt?: boolean;
        codeToCodex?: boolean;
    };
}, {
    google?: {
        enabled?: boolean;
        credentials?: {
            accessToken?: string;
            refreshToken?: string;
            expiresAt?: number;
            apiKey?: string;
        };
        defaultModel?: string;
    };
    openai?: {
        enabled?: boolean;
        credentials?: {
            accessToken?: string;
            refreshToken?: string;
            expiresAt?: number;
            apiKey?: string;
        };
        defaultModel?: string;
    };
    azure?: {
        enabled?: boolean;
        credentials?: {
            accessToken?: string;
            refreshToken?: string;
            expiresAt?: number;
            apiKey?: string;
        };
        defaultModel?: string;
        endpoint?: string;
    };
    autoDelegation?: {
        enabled?: boolean;
        frontendToGemini?: boolean;
        strategyToGpt?: boolean;
        codeToCodex?: boolean;
    };
}>;
declare const SkillsConfigSchema: z.ZodObject<{
    ultrawork: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        aliases: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        autoParallelAgents: z.ZodDefault<z.ZodBoolean>;
        autoTodoEnforcer: z.ZodDefault<z.ZodBoolean>;
        multiModelDelegation: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean;
        aliases?: string[];
        autoParallelAgents?: boolean;
        autoTodoEnforcer?: boolean;
        multiModelDelegation?: boolean;
    }, {
        enabled?: boolean;
        aliases?: string[];
        autoParallelAgents?: boolean;
        autoTodoEnforcer?: boolean;
        multiModelDelegation?: boolean;
    }>;
    deepResearch: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        maxSources: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean;
        maxSources?: number;
    }, {
        enabled?: boolean;
        maxSources?: number;
    }>;
    codeReview: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        autoFix: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean;
        autoFix?: boolean;
    }, {
        enabled?: boolean;
        autoFix?: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    ultrawork?: {
        enabled?: boolean;
        aliases?: string[];
        autoParallelAgents?: boolean;
        autoTodoEnforcer?: boolean;
        multiModelDelegation?: boolean;
    };
    deepResearch?: {
        enabled?: boolean;
        maxSources?: number;
    };
    codeReview?: {
        enabled?: boolean;
        autoFix?: boolean;
    };
}, {
    ultrawork?: {
        enabled?: boolean;
        aliases?: string[];
        autoParallelAgents?: boolean;
        autoTodoEnforcer?: boolean;
        multiModelDelegation?: boolean;
    };
    deepResearch?: {
        enabled?: boolean;
        maxSources?: number;
    };
    codeReview?: {
        enabled?: boolean;
        autoFix?: boolean;
    };
}>;
export declare const SisyphusConfigSchema: z.ZodObject<{
    version: z.ZodDefault<z.ZodString>;
    agents: z.ZodOptional<z.ZodObject<{
        sisyphus: z.ZodObject<{
            temperature: z.ZodDefault<z.ZodNumber>;
            maxTokens: z.ZodDefault<z.ZodNumber>;
        } & {
            model: z.ZodDefault<z.ZodString>;
            thinkingBudget: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        }, {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        }>;
        oracle: z.ZodObject<{
            temperature: z.ZodDefault<z.ZodNumber>;
            maxTokens: z.ZodDefault<z.ZodNumber>;
            thinkingBudget: z.ZodOptional<z.ZodNumber>;
        } & {
            model: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        }, {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        }>;
        librarian: z.ZodObject<{
            temperature: z.ZodDefault<z.ZodNumber>;
            maxTokens: z.ZodDefault<z.ZodNumber>;
            thinkingBudget: z.ZodOptional<z.ZodNumber>;
        } & {
            model: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        }, {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        }>;
        explorer: z.ZodObject<{
            temperature: z.ZodDefault<z.ZodNumber>;
            maxTokens: z.ZodDefault<z.ZodNumber>;
            thinkingBudget: z.ZodOptional<z.ZodNumber>;
        } & {
            model: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        }, {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        }>;
        prometheus: z.ZodObject<{
            temperature: z.ZodDefault<z.ZodNumber>;
            maxTokens: z.ZodDefault<z.ZodNumber>;
            thinkingBudget: z.ZodOptional<z.ZodNumber>;
        } & {
            model: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        }, {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        explorer?: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        };
        sisyphus?: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        };
        oracle?: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        };
        librarian?: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        };
        prometheus?: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        };
    }, {
        explorer?: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        };
        sisyphus?: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        };
        oracle?: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        };
        librarian?: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        };
        prometheus?: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        };
    }>>;
    concurrency: z.ZodOptional<z.ZodObject<{
        maxParallel: z.ZodDefault<z.ZodNumber>;
        stallTimeout: z.ZodDefault<z.ZodNumber>;
        stabilityPolls: z.ZodDefault<z.ZodNumber>;
        stabilityInterval: z.ZodDefault<z.ZodNumber>;
        ttl: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxParallel?: number;
        stallTimeout?: number;
        stabilityPolls?: number;
        stabilityInterval?: number;
        ttl?: number;
    }, {
        maxParallel?: number;
        stallTimeout?: number;
        stabilityPolls?: number;
        stabilityInterval?: number;
        ttl?: number;
    }>>;
    todoEnforcer: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        countdownSeconds: z.ZodDefault<z.ZodNumber>;
        minExecutionTime: z.ZodDefault<z.ZodNumber>;
        excludeAgents: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean;
        countdownSeconds?: number;
        minExecutionTime?: number;
        excludeAgents?: string[];
    }, {
        enabled?: boolean;
        countdownSeconds?: number;
        minExecutionTime?: number;
        excludeAgents?: string[];
    }>>;
    hooks: z.ZodOptional<z.ZodObject<{
        sessionStart: z.ZodDefault<z.ZodBoolean>;
        chatMessageBefore: z.ZodDefault<z.ZodBoolean>;
        toolExecuteBefore: z.ZodDefault<z.ZodBoolean>;
        toolExecuteAfter: z.ZodDefault<z.ZodBoolean>;
        sessionIdle: z.ZodDefault<z.ZodBoolean>;
        contextCompact: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        sessionStart?: boolean;
        chatMessageBefore?: boolean;
        toolExecuteBefore?: boolean;
        toolExecuteAfter?: boolean;
        sessionIdle?: boolean;
        contextCompact?: boolean;
    }, {
        sessionStart?: boolean;
        chatMessageBefore?: boolean;
        toolExecuteBefore?: boolean;
        toolExecuteAfter?: boolean;
        sessionIdle?: boolean;
        contextCompact?: boolean;
    }>>;
    skills: z.ZodOptional<z.ZodObject<{
        ultrawork: z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            aliases: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            autoParallelAgents: z.ZodDefault<z.ZodBoolean>;
            autoTodoEnforcer: z.ZodDefault<z.ZodBoolean>;
            multiModelDelegation: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enabled?: boolean;
            aliases?: string[];
            autoParallelAgents?: boolean;
            autoTodoEnforcer?: boolean;
            multiModelDelegation?: boolean;
        }, {
            enabled?: boolean;
            aliases?: string[];
            autoParallelAgents?: boolean;
            autoTodoEnforcer?: boolean;
            multiModelDelegation?: boolean;
        }>;
        deepResearch: z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            maxSources: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled?: boolean;
            maxSources?: number;
        }, {
            enabled?: boolean;
            maxSources?: number;
        }>;
        codeReview: z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            autoFix: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enabled?: boolean;
            autoFix?: boolean;
        }, {
            enabled?: boolean;
            autoFix?: boolean;
        }>;
    }, "strip", z.ZodTypeAny, {
        ultrawork?: {
            enabled?: boolean;
            aliases?: string[];
            autoParallelAgents?: boolean;
            autoTodoEnforcer?: boolean;
            multiModelDelegation?: boolean;
        };
        deepResearch?: {
            enabled?: boolean;
            maxSources?: number;
        };
        codeReview?: {
            enabled?: boolean;
            autoFix?: boolean;
        };
    }, {
        ultrawork?: {
            enabled?: boolean;
            aliases?: string[];
            autoParallelAgents?: boolean;
            autoTodoEnforcer?: boolean;
            multiModelDelegation?: boolean;
        };
        deepResearch?: {
            enabled?: boolean;
            maxSources?: number;
        };
        codeReview?: {
            enabled?: boolean;
            autoFix?: boolean;
        };
    }>>;
    externalModels: z.ZodOptional<z.ZodObject<{
        google: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            credentials: z.ZodOptional<z.ZodObject<{
                accessToken: z.ZodOptional<z.ZodString>;
                refreshToken: z.ZodOptional<z.ZodString>;
                expiresAt: z.ZodOptional<z.ZodNumber>;
                apiKey: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
                apiKey?: string;
            }, {
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
                apiKey?: string;
            }>>;
            defaultModel: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            enabled?: boolean;
            credentials?: {
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
                apiKey?: string;
            };
            defaultModel?: string;
        }, {
            enabled?: boolean;
            credentials?: {
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
                apiKey?: string;
            };
            defaultModel?: string;
        }>>;
        openai: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            credentials: z.ZodOptional<z.ZodObject<{
                accessToken: z.ZodOptional<z.ZodString>;
                refreshToken: z.ZodOptional<z.ZodString>;
                expiresAt: z.ZodOptional<z.ZodNumber>;
                apiKey: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
                apiKey?: string;
            }, {
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
                apiKey?: string;
            }>>;
            defaultModel: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            enabled?: boolean;
            credentials?: {
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
                apiKey?: string;
            };
            defaultModel?: string;
        }, {
            enabled?: boolean;
            credentials?: {
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
                apiKey?: string;
            };
            defaultModel?: string;
        }>>;
        azure: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            credentials: z.ZodOptional<z.ZodObject<{
                accessToken: z.ZodOptional<z.ZodString>;
                refreshToken: z.ZodOptional<z.ZodString>;
                expiresAt: z.ZodOptional<z.ZodNumber>;
                apiKey: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
                apiKey?: string;
            }, {
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
                apiKey?: string;
            }>>;
            endpoint: z.ZodOptional<z.ZodString>;
            defaultModel: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            enabled?: boolean;
            credentials?: {
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
                apiKey?: string;
            };
            defaultModel?: string;
            endpoint?: string;
        }, {
            enabled?: boolean;
            credentials?: {
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
                apiKey?: string;
            };
            defaultModel?: string;
            endpoint?: string;
        }>>;
        autoDelegation: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            frontendToGemini: z.ZodDefault<z.ZodBoolean>;
            strategyToGpt: z.ZodDefault<z.ZodBoolean>;
            codeToCodex: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enabled?: boolean;
            frontendToGemini?: boolean;
            strategyToGpt?: boolean;
            codeToCodex?: boolean;
        }, {
            enabled?: boolean;
            frontendToGemini?: boolean;
            strategyToGpt?: boolean;
            codeToCodex?: boolean;
        }>>;
    }, "strip", z.ZodTypeAny, {
        google?: {
            enabled?: boolean;
            credentials?: {
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
                apiKey?: string;
            };
            defaultModel?: string;
        };
        openai?: {
            enabled?: boolean;
            credentials?: {
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
                apiKey?: string;
            };
            defaultModel?: string;
        };
        azure?: {
            enabled?: boolean;
            credentials?: {
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
                apiKey?: string;
            };
            defaultModel?: string;
            endpoint?: string;
        };
        autoDelegation?: {
            enabled?: boolean;
            frontendToGemini?: boolean;
            strategyToGpt?: boolean;
            codeToCodex?: boolean;
        };
    }, {
        google?: {
            enabled?: boolean;
            credentials?: {
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
                apiKey?: string;
            };
            defaultModel?: string;
        };
        openai?: {
            enabled?: boolean;
            credentials?: {
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
                apiKey?: string;
            };
            defaultModel?: string;
        };
        azure?: {
            enabled?: boolean;
            credentials?: {
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
                apiKey?: string;
            };
            defaultModel?: string;
            endpoint?: string;
        };
        autoDelegation?: {
            enabled?: boolean;
            frontendToGemini?: boolean;
            strategyToGpt?: boolean;
            codeToCodex?: boolean;
        };
    }>>;
    disabledHooks: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    disabledTools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    debug: z.ZodDefault<z.ZodBoolean>;
    logLevel: z.ZodDefault<z.ZodEnum<["error", "warn", "info", "debug"]>>;
}, "strip", z.ZodTypeAny, {
    version?: string;
    agents?: {
        explorer?: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        };
        sisyphus?: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        };
        oracle?: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        };
        librarian?: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        };
        prometheus?: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        };
    };
    concurrency?: {
        maxParallel?: number;
        stallTimeout?: number;
        stabilityPolls?: number;
        stabilityInterval?: number;
        ttl?: number;
    };
    todoEnforcer?: {
        enabled?: boolean;
        countdownSeconds?: number;
        minExecutionTime?: number;
        excludeAgents?: string[];
    };
    hooks?: {
        sessionStart?: boolean;
        chatMessageBefore?: boolean;
        toolExecuteBefore?: boolean;
        toolExecuteAfter?: boolean;
        sessionIdle?: boolean;
        contextCompact?: boolean;
    };
    skills?: {
        ultrawork?: {
            enabled?: boolean;
            aliases?: string[];
            autoParallelAgents?: boolean;
            autoTodoEnforcer?: boolean;
            multiModelDelegation?: boolean;
        };
        deepResearch?: {
            enabled?: boolean;
            maxSources?: number;
        };
        codeReview?: {
            enabled?: boolean;
            autoFix?: boolean;
        };
    };
    externalModels?: {
        google?: {
            enabled?: boolean;
            credentials?: {
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
                apiKey?: string;
            };
            defaultModel?: string;
        };
        openai?: {
            enabled?: boolean;
            credentials?: {
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
                apiKey?: string;
            };
            defaultModel?: string;
        };
        azure?: {
            enabled?: boolean;
            credentials?: {
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
                apiKey?: string;
            };
            defaultModel?: string;
            endpoint?: string;
        };
        autoDelegation?: {
            enabled?: boolean;
            frontendToGemini?: boolean;
            strategyToGpt?: boolean;
            codeToCodex?: boolean;
        };
    };
    disabledHooks?: string[];
    disabledTools?: string[];
    debug?: boolean;
    logLevel?: "error" | "debug" | "warn" | "info";
}, {
    version?: string;
    agents?: {
        explorer?: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        };
        sisyphus?: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        };
        oracle?: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        };
        librarian?: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        };
        prometheus?: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            thinkingBudget?: number;
        };
    };
    concurrency?: {
        maxParallel?: number;
        stallTimeout?: number;
        stabilityPolls?: number;
        stabilityInterval?: number;
        ttl?: number;
    };
    todoEnforcer?: {
        enabled?: boolean;
        countdownSeconds?: number;
        minExecutionTime?: number;
        excludeAgents?: string[];
    };
    hooks?: {
        sessionStart?: boolean;
        chatMessageBefore?: boolean;
        toolExecuteBefore?: boolean;
        toolExecuteAfter?: boolean;
        sessionIdle?: boolean;
        contextCompact?: boolean;
    };
    skills?: {
        ultrawork?: {
            enabled?: boolean;
            aliases?: string[];
            autoParallelAgents?: boolean;
            autoTodoEnforcer?: boolean;
            multiModelDelegation?: boolean;
        };
        deepResearch?: {
            enabled?: boolean;
            maxSources?: number;
        };
        codeReview?: {
            enabled?: boolean;
            autoFix?: boolean;
        };
    };
    externalModels?: {
        google?: {
            enabled?: boolean;
            credentials?: {
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
                apiKey?: string;
            };
            defaultModel?: string;
        };
        openai?: {
            enabled?: boolean;
            credentials?: {
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
                apiKey?: string;
            };
            defaultModel?: string;
        };
        azure?: {
            enabled?: boolean;
            credentials?: {
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
                apiKey?: string;
            };
            defaultModel?: string;
            endpoint?: string;
        };
        autoDelegation?: {
            enabled?: boolean;
            frontendToGemini?: boolean;
            strategyToGpt?: boolean;
            codeToCodex?: boolean;
        };
    };
    disabledHooks?: string[];
    disabledTools?: string[];
    debug?: boolean;
    logLevel?: "error" | "debug" | "warn" | "info";
}>;
export type SisyphusConfig = z.infer<typeof SisyphusConfigSchema>;
export type AgentConfig = z.infer<typeof AgentConfigSchema>;
export type AgentsConfig = z.infer<typeof AgentsConfigSchema>;
export type ConcurrencyConfig = z.infer<typeof ConcurrencyConfigSchema>;
export type TodoEnforcerConfig = z.infer<typeof TodoEnforcerConfigSchema>;
export type HooksConfig = z.infer<typeof HooksConfigSchema>;
export type SkillsConfig = z.infer<typeof SkillsConfigSchema>;
export type ExternalModelsConfig = z.infer<typeof ExternalModelsConfigSchema>;
export type CredentialConfig = z.infer<typeof CredentialSchema>;
export declare const DEFAULT_CONFIG: SisyphusConfig;
export declare function validateConfig(config: unknown): SisyphusConfig;
export declare function mergeConfig(base: SisyphusConfig, override: Partial<SisyphusConfig>): SisyphusConfig;
export {};
//# sourceMappingURL=schema.d.ts.map