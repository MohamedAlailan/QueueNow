<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class EmployeeAuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate(['email' => 'required|email', 'password' => 'required|string']);
        $employee = Employee::where('email', $data['email'])->first();
        if (! $employee || ! $employee->password || ! Hash::check($data['password'], $employee->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        return response()->json(['token' => $employee->createToken('employee', ['employee'], now()->addHours(12))->plainTextToken, 'employee' => $employee]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Signed out.']);
    }
}
