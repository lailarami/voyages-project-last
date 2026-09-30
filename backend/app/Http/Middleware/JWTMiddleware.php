<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;

class JWTMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Utilisateur non trouvé.'], 401);
            }
        } catch (TokenExpiredException $e) {
            return response()->json(['success' => false, 'message' => 'Token expiré.', 'code' => 'TOKEN_EXPIRED'], 401);
        } catch (TokenInvalidException $e) {
            return response()->json(['success' => false, 'message' => 'Token invalide.'], 401);
        } catch (JWTException $e) {
            return response()->json(['success' => false, 'message' => 'Token manquant.'], 401);
        }

        return $next($request);
    }
}
